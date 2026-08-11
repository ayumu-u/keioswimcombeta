#!/usr/bin/env python3
"""見出し・キャッチコピーに BudouX の文節区切り（<wbr>）を焼き込む。

日本語は単語の切れ目が分からないため、ブラウザは任意の文字間で改行する。
その結果「可動床対/応）。」のように語の途中で折れてしまう。

BudouX で文節の境界を求めて <wbr> を挿し、CSS 側で
  word-break: keep-all（= <wbr> 以外では折らない）
  overflow-wrap: break-word（= 1文節が1行に入らない時だけ折る）
を効かせることで、意味のまとまりごとに改行されるようにする。

実行時のライブラリ読み込みは不要。HTML に書き込んで完結させる。
再実行しても二重にならないよう、既存の <wbr> は取り除いてから処理する。
"""
import glob
import os
import re
import sys

import budoux

# 対象は見出しと短いキャッチ。長い本文は通常の折り返しで問題ないため触らない。
TARGETS = [
    "pg-title", "pg-lead", "pg-note",
    "section-title", "section-catch", "section-lead",
    "pillar-title", "pillar-sub", "pillar-catch",
    "es-title", "es-text",
    "sup-label", "sup-title",
    "cf-label", "cf-title",
    "dt-title", "dt-msg", "dt-note",
    "cs-q", "cs-day-h",
    "cg-title", "pdf-text",
    "hs-copy", "hs-body",
    "st-lead", "st-main", "st-sub",
    "parents-title", "parents-lead",
    "vp-title", "wk-th", "wk-cell",
    "cert-title", "coach-role", "day-title",
    "dorm-note", "routes-title", "adm-name", "adm-title",
    "footer-name", "contact-box-h", "cc-cat",
]
# クラスを持たない要素も対象にする（タグ名で指定）
TAG_TARGETS = [
    ("contact-box", "h2"), ("contact-box", "h3"),
    ("pcard", "h3"), ("faq", "summary"),
]

parser = budoux.load_default_japanese_parser()
TAG = re.compile(r"(<[^>]+>)")


MIN_CHUNK = 3


def merge_short(chunks: list) -> list:
    """短い断片を「次の塊」に繰り入れ、3文字以上のまとまりにする。

    後ろではなく前に送るのが要点。BudouX は複合動詞を
    「切り / 替え、」「追い / 込めます。」のように割ることがあり、
    後ろに足すと「〜を切り」で改行できてしまう。
    前に送れば「切り替え、」と1つになる。
    「な / ぜ慶應を」のような誤分割も同じ扱いで直る。

    副次的に、どの塊も3文字以上になるので、
    行末に1〜2文字だけ残る現象も起きなくなる。
    """
    out, buf = [], ""
    for ch in chunks:
        buf += ch
        if len(buf) >= MIN_CHUNK:
            out.append(buf)
            buf = ""
    if buf:  # 末尾の余りだけは直前につなぐ
        if out:
            out[-1] += buf
        else:
            out.append(buf)
    return out


def segment(text: str) -> str:
    """テキストの文節境界に <wbr> を挿す。"""
    if not text.strip():
        return text
    # 前後の空白は保ったまま中身だけ処理する
    lead = text[: len(text) - len(text.lstrip())]
    trail = text[len(text.rstrip()):]
    body = text.strip()
    chunks = merge_short(parser.parse(body))
    return lead + "<wbr>".join(chunks) + trail


def process_inner(html: str) -> str:
    """タグを保ったまま、テキスト部分だけ文節分割する。"""
    parts = TAG.split(html)
    for i, p in enumerate(parts):
        if p.startswith("<"):
            continue
        parts[i] = segment(p)
    return "".join(parts)


def find_elements(html: str, opener: re.Pattern):
    """開始タグにマッチする要素の内側の範囲を返す（入れ子対応）。"""
    for m in opener.finditer(html):
        tag = m.group("tag")
        start = m.end()
        depth = 1
        pos = start
        pat = re.compile(rf"</?{tag}\b", re.I)
        while depth:
            nxt = pat.search(html, pos)
            if not nxt:
                break
            depth += -1 if html[nxt.start() + 1] == "/" else 1
            pos = nxt.end()
        if depth:
            continue
        end = html.rfind("<", start, pos)
        yield start, end


def run(path: str) -> int:
    html = open(path, encoding="utf-8").read()
    html = html.replace("<wbr>", "")  # 再実行しても二重にしない
    edits = 0

    specs = [re.compile(rf'<(?P<tag>[a-z0-9]+)[^>]*class="[^"]*\b{re.escape(c)}\b[^"]*"[^>]*>', re.I)
             for c in TARGETS]
    for parent, tag in TAG_TARGETS:
        specs.append(re.compile(
            rf'<(?P<tag>{tag})\b[^>]*>', re.I))

    # 同じ要素が複数のパターンに当たると二重に分割され、
    # 「なぜ」が「な / ぜ」のように壊れる。先に範囲を集めて重複を除く
    spans = set()
    for pat in specs:
        spans.update(find_elements(html, pat))

    picked = []
    for start, end in sorted(spans, key=lambda s: (s[0], -s[1])):
        # 入れ子は外側だけを処理する
        if any(s <= start and end <= e for s, e in picked):
            continue
        picked.append((start, end))

    for start, end in sorted(picked, reverse=True):
        inner = html[start:end]
        if "<" in inner and re.search(r"<(div|section|ul|ol|figure)\b", inner, re.I):
            continue  # ブロックを含むものは対象外
        new = process_inner(inner)
        if new != inner:
            html = html[:start] + new + html[end:]
            edits += 1

    open(path, "w", encoding="utf-8").write(html)
    return edits


if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(__file__), ".."))
    total = 0
    for f in sorted(glob.glob("*.html")):
        n = run(f)
        total += n
        print(f"  {f:14s} {n}箇所")
    print(f"合計 {total}箇所に文節区切りを挿入")

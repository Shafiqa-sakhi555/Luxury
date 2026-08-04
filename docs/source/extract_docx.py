import sys
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn


def iter_block_items(parent):
    body = parent.element.body
    for child in body.iterchildren():
        if child.tag == qn('w:p'):
            yield Paragraph(child, parent)
        elif child.tag == qn('w:tbl'):
            yield Table(child, parent)


def render(path):
    doc = Document(path)
    out = []
    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            text = block.text.strip()
            if not text:
                continue
            style = (block.style.name or '').lower()
            if style.startswith('heading'):
                level = ''.join(c for c in style if c.isdigit()) or '1'
                out.append('#' * min(int(level) + 1, 6) + ' ' + text)
            elif 'list' in style:
                out.append('- ' + text)
            else:
                out.append(text)
        else:
            rows = []
            for row in block.rows:
                cells = [c.text.strip().replace('\n', ' / ') for c in row.cells]
                rows.append('| ' + ' | '.join(cells) + ' |')
            if rows:
                ncol = len(block.rows[0].cells)
                rows.insert(1, '|' + '---|' * ncol)
                out.append('\n'.join(rows))
    return '\n\n'.join(out)


if __name__ == '__main__':
    print(render(sys.argv[1]))

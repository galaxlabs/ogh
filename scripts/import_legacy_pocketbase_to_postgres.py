#!/usr/bin/env python3
import json
import os
import sqlite3
import urllib.request

SQLITE_PATH = os.environ.get('LEGACY_SQLITE_PATH', '/home/fg/ogh/apps/pocketbase/pb_data/data.db')
PUBLISH_URL = os.environ.get('OPENCLAW_PUBLISH_URL', 'http://127.0.0.1:3100/api/openclaw/publish')
PUBLISH_TOKEN = os.environ.get('OPENCLAW_PUBLISH_TOKEN', '')


def post_json(payload):
    req = urllib.request.Request(PUBLISH_URL, method='POST')
    req.add_header('Content-Type', 'application/json')
    if PUBLISH_TOKEN:
        req.add_header('Authorization', f'Bearer {PUBLISH_TOKEN}')
    data = json.dumps(payload).encode('utf-8')
    with urllib.request.urlopen(req, data=data, timeout=20) as response:
        return response.status, response.read().decode('utf-8')


def main():
    if not os.path.exists(SQLITE_PATH):
        raise SystemExit(f'Legacy sqlite file not found: {SQLITE_PATH}')
    if not PUBLISH_TOKEN:
        raise SystemExit('OPENCLAW_PUBLISH_TOKEN is required')

    con = sqlite3.connect(SQLITE_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    try:
        rows = cur.execute('SELECT id, title, excerpt, content, status, author, category, tags, publishedAt FROM posts').fetchall()
    except sqlite3.Error as exc:
        raise SystemExit(f'Unable to read posts table: {exc}')

    if not rows:
        print('No legacy posts found to import.')
        con.close()
        return

    imported = 0
    for row in rows:
        payload = {
            'item_id': row['id'],
            'title': row['title'] or 'Imported Post',
            'url': '',
            'note': row['excerpt'] or '',
            'category': row['category'] or 'Imported',
            'source_domain': 'legacy-pocketbase',
            'formatted_text': row['content'] or row['excerpt'] or row['title'] or '',
            'source': {
                'chat_id': '0',
                'message_id': 0,
                'date_utc': row['publishedAt'] or '',
            },
        }
        status, body = post_json(payload)
        print(f"Imported legacy post {row['id']}: HTTP {status} {body[:120]}")
        imported += 1

    con.close()
    print(f'Imported {imported} legacy post(s) into PostgreSQL.')


if __name__ == '__main__':
    main()

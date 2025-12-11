# tests/integration/get-fragments-text-conversions.hurl
# Test text-to-text conversions via .ext extension

# 1. Create a markdown fragment
POST http://localhost:8080/v1/fragments

Content-Type: text/markdown

[BasicAuth]
user1@email.com:password1

```
# Hello World

This is **bold** text.
```

HTTP/1.1 201

[Captures]
markdown_url: header "Location"

# 2. Get markdown as HTML
GET {{markdown_url}}.html

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: text/html

[Asserts]
body contains "<h1>Hello World</h1>"
body contains "<strong>bold</strong>"

# 3. Get markdown as plain text (MD to TXT conversion)
GET {{markdown_url}}.txt

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: text/plain

[Asserts]
body contains "Hello World"
body contains "bold"

# 4. Create a plain text fragment
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

```
Hello world
This is plain text
```

HTTP/1.1 201

[Captures]
text_url: header "Location"

# 5. Get plain text as markdown (TXT to MD conversion)
GET {{text_url}}.md

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: text/markdown

[Asserts]
body contains "```"
body contains "Hello world"

# 6. Create a JSON fragment
POST http://localhost:8080/v1/fragments

Content-Type: application/json

[BasicAuth]
user1@email.com:password1

`{"name": "test", "value": 123}`

HTTP/1.1 201

[Captures]
json_url: header "Location"

# 4. Get JSON as HTML
GET {{json_url}}.html

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: text/html

[Asserts]
body contains "&quot;name&quot;"
body contains "&quot;test&quot;"

# 5. Get JSON as Markdown
GET {{json_url}}.md

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: text/markdown

[Asserts]
body contains "```json"
body contains "&quot;name&quot;"

# 6. Create a plain text fragment
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Hello <world> & "test"`

HTTP/1.1 201

[Captures]
text_url: header "Location"

# 10. Get text as HTML
GET {{text_url}}.html

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: text/html

[Asserts]
body contains "&lt;world&gt;"
body contains "&amp;"
body contains "&quot;test&quot;"



# tests/integration/put-fragments.hurl
# Authenticated PUT to /v1/fragments/:id

# 1. First, create a fragment to update
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Original fragment data`

HTTP/1.1 201

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"

[Captures]
fragment_url: header "Location"
fragment_id: jsonpath "$.fragment.id"

# 2. Update the fragment with new data
PUT {{fragment_url}}

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Updated fragment data`

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment_id}}"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 21
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.created" isString
# Note: Cannot directly compare two jsonpaths in Hurl, but we verify both are strings

# 3. Verify the updated data by GETting the fragment
GET {{fragment_url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: text/plain

[Asserts]
body == "Updated fragment data"

# 4. Update fragment to different type (text/html)
PUT {{fragment_url}}

Content-Type: text/html

[BasicAuth]
user1@email.com:password1

`<p>HTML fragment</p>`

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/html"
jsonpath "$.fragment.size" == 20

# 5. Verify the type change
GET {{fragment_url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: text/html

[Asserts]
body == "<p>HTML fragment</p>"



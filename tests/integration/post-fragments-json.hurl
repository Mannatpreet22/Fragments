# Test that posting a JSON fragment works, and doing a GET for the same fragment
# returns the expected result
POST http://localhost:8080/v1/fragments

# We're sending a JSON fragment
Content-Type: application/json

# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1

# Body of the request - JSON data
`{"name": "test", "value": 123, "active": true}`

# We expect to get back an HTTP 201
HTTP/1.1 201

# Verify the response
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
# The size should be the length of our JSON string: {"name": "test", "value": 123, "active": true}
jsonpath "$.fragment.size" == 46

# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"

# GET the fragment we just posted to verify it returns the expected JSON
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: application/json

Content-Length: 46

[Asserts]
# Verify the body matches what we sent (exact JSON string)
body == "{\"name\": \"test\", \"value\": 123, \"active\": true}"


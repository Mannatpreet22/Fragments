# 404 Test - Verify that non-existent routes return 404
GET http://localhost:8080/no-such-route

# We should get back an HTTP 404 response
HTTP/1.1 404

# Verify the response is JSON with error structure
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" == "not found"
jsonpath "$.error.code" == 404


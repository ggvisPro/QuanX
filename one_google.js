let body = $response.body;
if (body) {
  body = body
    .replace(/30tb\.ai\.pro\.m/g, "30tb.m")
    .replace(/20tb\.m\.v2/g, "20tb.m");
}
$done({ body });

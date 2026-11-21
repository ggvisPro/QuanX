/*******************************

[rewrite_local]
^https:\/\/one\.google\.com\/ai\?.* url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/refs/heads/main/one_google.js


[mitm] 
hostname = one.google.com

*******************************/

let body = $response.body;
if (body) {
  body = body
    .replace(/30tb\.ai\.pro\.m/g, "30tb.m")
    .replace(/20tb\.m\.v2/g, "20tb.m");
}
$done({ body });

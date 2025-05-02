/*******************************

脚本功能：医考帮题库，收费课全解锁，不显示VIP时间。
作者：ggvis
时间：20240323

*******************************

[rewrite_local]
^http[s]:\/\/weixin.haoyisheng.com\/wx\/submitOrderWXPay url script-request-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/hys.js


[mitm] 
hostname = haoyisheng.com

*******************************/

if ($response.body && $request.url.includes("index.php/curriculum/main/detail")) {
var body = $response.body.replace(/is_free_watch":"\d+"/g,'is_free_watch":"1"');
}

if ($response.body && $request.url.includes("allQuestion/question/chapter")) {
var body = $response.body.replace(/pass":"\d+"/g,'pass":"1"');
}

$done({ body });

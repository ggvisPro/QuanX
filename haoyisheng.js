/*******************************

脚本功能：好医生刷课
作者：ggvis
时间：20240706

*******************************

[rewrite_local]
^https?:\/\/weixin\.haoyisheng\.com\/wx\/getCourseInfo url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

^https?:\/\/weixin\.haoyisheng\.com\/wx\/getTestsNew url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

^https?:\/\/weixin\.haoyisheng\.com\/wx\/syncQuestionAnswers url script-echo-response https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

[mitm]
hostname = weixin.haoyisheng.com

*******************************/

// 生成UUID
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

// 获取当前时间字符串 yyyy-MM-dd HH:mm:ss
function getNow() {
  var d = new Date();
  var pad = function(n) { return n < 10 ? "0" + n : "" + n; };
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
    " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

// 获取或初始化batch_id（设备固定ID，首次生成后缓存）
function getBatchId() {
  var bid = $prefs.valueForKey("hys_batch_id");
  if (!bid) {
    bid = generateUUID();
    $prefs.setValueForKey(bid, "hys_batch_id");
  }
  return bid;
}

var url = $request.url;

// 拦截获取题目响应：显示答案 + 自动提交正确答案 + 记录通过
if ($response && $response.body && url.includes("getTestsNew")) {
  var body = JSON.parse($response.body);
  var result = "";
  var simple_result = "";
  var answers = [];

  body.tests.forEach(function(test) {
    result += test.answer + " -- " + test.questionTitle + "\n";
    simple_result += test.answer + " ";
    answers.push({ answer: test.answer, questionID: test.questionID });
  });

  // 从URL提取参数
  var tokenMatch = url.match(/token=([^&]+)/);
  var loginname = tokenMatch ? tokenMatch[1] : "";

  var testIdMatch = url.match(/test_id=([^&]+)/);
  var testId = testIdMatch ? testIdMatch[1] : "";
  // test_id格式: 202601015886-02 → course_id=202601015886, ware_id=02
  var parts = testId.split("-");
  var course_id = parts[0] || "";
  var ware_id = parts[1] || "";

  // 构建提交答案URL
  var answerData = JSON.stringify({ answers: answers, loginname: loginname });
  var submitUrl = "https://weixin.haoyisheng.com/wx/syncQuestionAnswers?answer=" + encodeURIComponent(answerData);

  var headers = {};
  for (var key in $request.headers) {
    headers[key] = $request.headers[key];
  }
  headers["Content-Type"] = "application/x-www-form-urlencoded";
  headers["Content-Length"] = "0";

  $notify("好医生-答案", simple_result.trim(), result);

  var startdate = getNow();

  // 第一步：提交正确答案
  $task.fetch({
    url: submitUrl,
    method: "POST",
    headers: headers,
    body: ""
  }).then(function(resp) {
    $notify("好医生-答案已提交", simple_result.trim(), resp.body);

    // 第二步：记录考试通过
    var passdate = getNow();
    var batch_id = getBatchId();
    var examlogUrl = "https://weixin.haoyisheng.com/wx/examlog?"
      + "batch_id=" + encodeURIComponent(batch_id)
      + "&course_id=" + encodeURIComponent(course_id)
      + "&ip="
      + "&logType=3"
      + "&passdate=" + encodeURIComponent(passdate)
      + "&startOrPass=1"
      + "&startdate=" + encodeURIComponent(startdate)
      + "&token=" + encodeURIComponent(loginname)
      + "&ware_id=" + encodeURIComponent(ware_id);

    $task.fetch({
      url: examlogUrl,
      method: "GET",
      headers: headers
    }).then(function(resp2) {
      $notify("好医生-考试通过已记录", course_id + "-" + ware_id, resp2.body);
      $done({ body: $response.body });
    }, function(err2) {
      $notify("好医生-记录失败", String(err2));
      $done({ body: $response.body });
    });

  }, function(err) {
    $notify("好医生-提交失败", String(err));
    $done({ body: $response.body });
  });

// 拦截用户手动提交：直接返回假成功，不让它覆盖已提交的正确答案
} else if (url.includes("syncQuestionAnswers")) {
  $notify("好医生", "已拦截手动提交（正确答案已自动提交）");
  $done({
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: '{"status":0,"msg":"成功"}'
  });

// 拦截课程信息响应：标记已学习
} else if ($response && $response.body && url.includes("getCourseInfo")) {
  var body = $response.body.replace(/study_status":"0"/g, 'study_status":"1"');
  $done({ body });

} else {
  $done({});
}

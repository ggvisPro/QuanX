/*******************************

脚本功能：好医生刷课
作者：ggvis
时间：20240706

*******************************

[rewrite_local]
^https?:\/\/weixin\.haoyisheng\.com\/wx\/getCourseInfo url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

^https?:\/\/weixin\.haoyisheng\.com\/wx\/getTestsNew url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

[mitm]
hostname = weixin.haoyisheng.com

*******************************/

var url = $request.url;

// 拦截获取题目响应：显示答案 + 自动提交正确答案
if ($response && $response.body && url.includes("getTestsNew")) {
  var body = JSON.parse($response.body);
  var result = "";
  var simple_result = "";
  var answers = [];

  body.tests.forEach((test) => {
    result += test.answer + " -- " + test.questionTitle + "\n";
    simple_result += test.answer + " ";
    answers.push({ answer: test.answer, questionID: test.questionID });
  });

  // 从URL提取loginname (token参数)
  var tokenMatch = url.match(/token=([^&]+)/);
  var loginname = tokenMatch ? tokenMatch[1] : "";

  var answerData = JSON.stringify({ answers: answers, loginname: loginname });
  var submitUrl = "https://weixin.haoyisheng.com/wx/syncQuestionAnswers?answer=" + encodeURIComponent(answerData);

  // 复用当前请求的headers
  var headers = Object.assign({}, $request.headers);
  headers["Content-Type"] = "application/x-www-form-urlencoded";
  headers["Content-Length"] = "0";

  $task.fetch({
    url: submitUrl,
    method: "POST",
    headers: headers,
    body: ""
  }).then((resp) => {
    $notify("好医生-自动提交", "答案：" + simple_result.trim(), resp.body);
  }, (err) => {
    $notify("好医生-提交失败", String(err));
  });

  // 同时通知答案详情
  $notify("答案：" + simple_result.trim(), "", result);
  $done({ body: $response.body });

// 拦截课程信息响应：标记已学习
} else if ($response && $response.body && url.includes("getCourseInfo")) {
  var body = $response.body.replace(/study_status":"0"/g, 'study_status":"1"');
  $done({ body });

} else {
  $done({});
}

/*******************************

脚本功能：好医生刷课
作者：ggvis
时间：20240706

*******************************

[rewrite_local]
^https?:\/\/weixin\.haoyisheng\.com\/wx\/getCourseInfo url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

^https?:\/\/weixin\.haoyisheng\.com\/wx\/getTestsNew url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

^https?:\/\/weixin\.haoyisheng\.com\/wx\/syncQuestionAnswers url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

[mitm]
hostname = weixin.haoyisheng.com

*******************************/

var url = $request.url;

// 拦截获取题目响应：显示答案 + 缓存正确答案
if ($response && $response.body && url.includes("getTestsNew")) {
  var body = JSON.parse($response.body);
  var result = "";
  var simple_result = "";
  var answerMap = {};

  body.tests.forEach(function(test) {
    result += test.answer + " -- " + test.questionTitle + "\n";
    simple_result += test.answer + " ";
    answerMap[test.questionID] = test.answer;
  });

  // 缓存正确答案和请求头
  $prefs.setValueForKey(JSON.stringify(answerMap), "hys_correct_answers");

  // 从URL提取loginname
  var tokenMatch = url.match(/token=([^&]+)/);
  if (tokenMatch) {
    $prefs.setValueForKey(tokenMatch[1], "hys_loginname");
  }

  $notify("好医生-答案", simple_result.trim(), result);
  $done({ body: $response.body });

// 拦截提交答案的响应：APP已提交完毕，立刻用正确答案再提交一次覆盖
} else if ($response && $response.body && url.includes("syncQuestionAnswers")) {
  var saved = $prefs.valueForKey("hys_correct_answers");
  var loginname = $prefs.valueForKey("hys_loginname") || "";

  if (saved) {
    var answerMap = JSON.parse(saved);
    var answers = [];
    for (var qid in answerMap) {
      answers.push({ answer: answerMap[qid], questionID: qid });
    }
    var answerData = JSON.stringify({ answers: answers, loginname: loginname });
    var submitUrl = "https://weixin.haoyisheng.com/wx/syncQuestionAnswers?answer=" + encodeURIComponent(answerData);

    var headers = {};
    for (var key in $request.headers) {
      headers[key] = $request.headers[key];
    }

    $task.fetch({
      url: submitUrl,
      method: "POST",
      headers: headers,
      body: ""
    }).then(function(resp) {
      $notify("好医生-已覆盖为正确答案", "", resp.body);
      $done({ body: $response.body });
    }, function(err) {
      $notify("好医生-覆盖失败", String(err));
      $done({ body: $response.body });
    });
  } else {
    $done({ body: $response.body });
  }

// 拦截课程信息响应：标记已学习
} else if ($response && $response.body && url.includes("getCourseInfo")) {
  var body = $response.body.replace(/study_status":"0"/g, 'study_status":"1"');
  $done({ body });

} else {
  $done({});
}

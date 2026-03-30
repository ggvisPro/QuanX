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

var url = $request.url;

// 拦截获取题目响应：显示答案 + 缓存正确答案
if ($response && $response.body && url.includes("getTestsNew")) {
  var body = JSON.parse($response.body);
  var result = "";
  var simple_result = "";
  var correctAnswers = {};

  body.tests.forEach((test) => {
    result += `${test.answer} -- ${test.questionTitle}\n`;
    simple_result += test.answer + " ";
    correctAnswers[test.questionID] = test.answer;
  });

  // 缓存正确答案供提交时使用
  $prefs.setValueForKey(JSON.stringify(correctAnswers), "hys_correct_answers");

  simple_result = "答案：" + simple_result.trim() + "  长按查看详情";
  $notify(simple_result, result);
  $done({ body: $response.body });

// 拦截提交答案请求：替换为正确答案，用$task.fetch发送修正请求
} else if (url.includes("syncQuestionAnswers")) {
  var saved = $prefs.valueForKey("hys_correct_answers");
  if (saved) {
    var correctAnswers = JSON.parse(saved);
    var answerParam = url.split("answer=")[1];
    if (answerParam) {
      var ampIndex = answerParam.indexOf("&");
      if (ampIndex !== -1) {
        answerParam = answerParam.substring(0, ampIndex);
      }
      var answerData = JSON.parse(decodeURIComponent(answerParam));

      // 替换每道题的答案为正确答案
      answerData.answers.forEach((item) => {
        if (correctAnswers[item.questionID]) {
          item.answer = correctAnswers[item.questionID];
        }
      });

      // 重建URL并用$task.fetch发送真实请求
      var newAnswerParam = encodeURIComponent(JSON.stringify(answerData));
      var baseUrl = url.split("answer=")[0];
      var newUrl = baseUrl + "answer=" + newAnswerParam;

      var reqHeaders = $request.headers;
      reqHeaders["Content-Length"] = "0";

      $task.fetch({
        url: newUrl,
        method: "POST",
        headers: reqHeaders,
        body: ""
      }).then((resp) => {
        $notify("好医生", "已自动替换为正确答案并提交");
        $done({
          status: resp.statusCode,
          headers: resp.headers,
          body: resp.body
        });
      }, (err) => {
        $notify("好医生", "提交失败: " + err);
        $done({
          status: 500,
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({"status": -1, "msg": "提交失败"})
        });
      });
    } else {
      $done({});
    }
  } else {
    $notify("好医生", "未找到缓存答案，请先打开题目页面");
    $done({});
  }

// 拦截课程信息响应：标记已学习
} else if ($response && $response.body && url.includes("getCourseInfo")) {
  var body = $response.body.replace(/study_status":"0"/g, 'study_status":"1"');
  $done({ body });

} else {
  $done({});
}

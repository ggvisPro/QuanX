/*******************************

脚本功能：好医生刷课
作者：ggvis
时间：20240706

*******************************

[rewrite_local]
^https?:\/\/weixin\.haoyisheng\.com\/wx\/getCourseInfo url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

^https?:\/\/weixin\.haoyisheng\.com\/wx\/getTestsNew url script-response-body https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

^https?:\/\/weixin\.haoyisheng\.com\/wx\/syncQuestionAnswers url script-request-header https://raw.githubusercontent.com/ggvisPro/QuanX/main/haoyisheng.js

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

// 拦截提交答案请求：替换为正确答案
} else if (url.includes("syncQuestionAnswers")) {
  var saved = $prefs.valueForKey("hys_correct_answers");
  if (saved) {
    var correctAnswers = JSON.parse(saved);
    // 从URL中提取answer参数
    var answerParam = url.split("answer=")[1];
    if (answerParam) {
      // answer参数可能后面还有其他参数
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

      // 重建URL
      var newAnswerParam = encodeURIComponent(JSON.stringify(answerData));
      var baseUrl = url.split("answer=")[0];
      var newUrl = baseUrl + "answer=" + newAnswerParam;

      $notify("好医生", "已自动替换为正确答案");
      $done({ url: newUrl });
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

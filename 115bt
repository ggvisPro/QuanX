/*******************************

脚本功能：该脚本无破解离线功能,只是给新版115的App添加创建离线任务的方法。
作者：转发的,原始作者:https://raw.githubusercontent.com/ikanam/Surge-Scripts/master/115lx.js
时间：

*******************************

[rewrite_local]
^http:\/\/115\.com\/lx.*$ url script-request-body https://raw.githubusercontent.com/ggvisPro/QuanX/refs/heads/main/115bt.js
^https?:\/\/webapi\.115\.com\/user\/check_sign.*$ url script-request-body https://raw.githubusercontent.com/ggvisPro/QuanX/refs/heads/main/115bt.js

[mitm] 
hostname = *.115.com

*******************************/

var body = $response.body;
if ($request.url.indexOf('/user/check_sign') != -1) {
    let json = JSON.parse(body);
    json.data.is_new_sign = false;
    body = JSON.stringify(json);
} else {
    body = body.replace("UDown", 'XXXXXXXXX'); // 使重定向判断条件失效
    let clearJS = `<script type="text/javascript">
    $(function(){
        function actionSheetAction(index) {
            if (index == 4) { return; }
            $.ajax({
                url: '/web/lixian/?ct=lixian&ac=task_clear',
                dataType: 'json',
                data: {flag: index},
                type: 'POST',
                cache: false,
                success: function (r) {
                    window.location.reload();
                },
                error: function(){
                    console.log('清空失败');
                }
            });
        }
        function clearAction() { 
            OOFJS.common.actionSheet('选择清空的操作', ['清空已完成任务', '清空全部任务', '清空失败任务', '清空进行中任务'], actionSheetAction);
        }
        setTimeout(function(){OOFJS.common.addRightBarItem('清空', clearAction);}, 200);
    });
    </script>`
    body = body.replace("</body>", clearJS + '\n</body>'); // 注入清空任务相关JS
}
$done({body});

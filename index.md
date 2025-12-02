# 张俊的课程资源
<div align="center">
<head>  
    <meta charset="utf-8" />  
    <title>电子时钟</title>  
    <style type="text/css">  
                html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{margin:0;padding:0;border:0}body{font-family:Helvetica,arial,freesans,clean,sans-serif;font-size:14px;line-height:1.6;color:#333;background-color:#fff;padding:20px;max-width:960px;margin:0 auto}body>*:first-child{margin-top:0 !important}body>*:last-child{margin-bottom:0 !important}p,blockquote,ul,ol,dl,table,pre{margin:15px 0}h1,h2,h3,h4,h5,h6{margin:20px 0 10px;padding:0;font-weight:bold;-webkit-font-smoothing:antialiased}h1 tt,h1 code,h2 tt,h2 code,h3 tt,h3 code,h4 tt,h4 code,h5 tt,h5 code,h6 tt,h6 code{font-size:inherit}h1{font-size:28px;color:#000}h2{font-size:24px;border-bottom:1px solid #ccc;color:#000}h3{font-size:18px}h4{font-size:16px}h5{font-size:14px}h6{color:#777;font-size:14px}body>h2:first-child,body>h1:first-child,body>h1:first-child+h2,body>h3:first-child,body>h4:first-child,body>h5:first-child,body>h6:first-child{margin-top:0;padding-top:0}a:first-child h1,a:first-child h2,a:first-child h3,a:first-child h4,a:first-child h5,a:first-child h6{margin-top:0;padding-top:0}h1+p,h2+p,h3+p,h4+p,h5+p,h6+p{margin-top:10px}a{color:#4183c4;text-decoration:none}a:hover{text-decoration:underline}ul,ol{padding-left:30px}ul li>:first-child,ol li>:first-child,ul li ul:first-of-type,ol li ol:first-of-type,ul li ol:first-of-type,ol li ul:first-of-type{margin-top:0}ul ul,ul ol,ol ol,ol ul{margin-bottom:0}dl{padding:0}dl dt{font-size:14px;font-weight:bold;font-style:italic;padding:0;margin:15px 0 5px}dl dt:first-child{padding:0}dl dt>:first-child{margin-top:0}dl dt>:last-child{margin-bottom:0}dl dd{margin:0 0 15px;padding:0 15px}dl dd>:first-child{margin-top:0}dl dd>:last-child{margin-bottom:0}pre,code,tt{font-size:12px;font-family:Consolas,"Liberation Mono",Courier,monospace}code,tt{margin:0;padding:0;white-space:nowrap;border:1px solid #eaeaea;background-color:#f8f8f8;border-radius:3px}pre>code{margin:0;padding:0;white-space:pre;border:0;background:transparent}pre{background-color:#f8f8f8;border:1px solid #ccc;font-size:13px;line-height:19px;overflow:auto;padding:6px 10px;border-radius:3px}pre code,pre tt{background-color:transparent;border:0}blockquote{border-left:4px solid #DDD;padding:0 15px;color:#777}blockquote>:first-child{margin-top:0}blockquote>:last-child{margin-bottom:0}hr{clear:both;margin:15px 0;height:0;overflow:hidden;border:0;background:transparent;border-bottom:4px solid #ddd;padding:0}table th{font-weight:bold}table th,table td{border:1px solid #ccc;padding:6px 13px}table tr{border-top:1px solid #ccc;background-color:#fff}table tr:nth-child(2n){background-color:#f8f8f8}img{max-width:100%}
        #container {  
            text-align: center;  
            padding: 20px;  
            border-radius: 15px;  
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); /* 阴影效果 */  
            background: rgba(255, 255, 255, 0.1); /* 半透明背景 */  
        }

        body_time {  
            margin: 0;  
            padding: 0;  
            height: 100%;  
            display: flex;  
            justify-content: center;  
            align-items: center;  
            font-family: Arial, sans-serif;  
            background: linear-gradient(135deg, #74ebd5, #acb6e5); /* 渐变背景 */  
            color: #fff; /* 字体颜色 */  
        }  
        
        h1 {
            text-align: center;  
            font-size: 36px;  
            margin-bottom: 20px;  
        }  
        #clock {  
            font-size: 64px; /* 增大字体 */  
            text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.7); /* 字体阴影 */  
            animation: pulse 1s infinite; /* 动画效果 */  
        }  
        @keyframes pulse {  
            0% {  
                transform: scale(1);  
            }  
            50% {  
                transform: scale(1.05);  
            }  
            100% {  
                transform: scale(1);  
            }  
        }  
    </style>  
</head>
<h1>北京时间</h1>    
<body_time>   
    <div id="container">   
        <div id="clock"></div> <!-- 用于显示时间的div -->  
    </div>  

    <script>  
        function updateTime() {  
            const now = new Date();  
            const beijingTime = new Date(now.getTime());  
            const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };  
            document.getElementById('clock').innerText = beijingTime.toLocaleTimeString('zh-CN', options);  
        }  

        setInterval(updateTime, 1000);  
        updateTime(); // 初始化显示时间  
    </script>  
</body_time> 
</div>

# 梦在前方
<div align="center"> 
    <iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=70525&auto=1&height=66">
    </iframe>
</div>

# 《神经网络与深度学习》虚拟仿真实验系统
<div align="center">
<input type="button" name="7" id="7" style="background-color: red; color: white; font-size: 18px; padding: 10px 20px;" value="进入虚拟仿真实验系统！" onclick="window.location.href='../index1.html'" />
</div>

# 常用软件下载
<div align="center">
<input type="button" name="7" id="7" style="background-color: red; color: white; font-size: 18px; padding: 10px 20px;" value="常用软件下载！" onclick="window.location.href='../index2.html'" />
</div>

# 教学模版文件下载
<div align="center">
<input type="button" name="7" id="7" style="background-color: red; color: white; font-size: 18px; padding: 10px 20px;" value="教学模版文件下载！" onclick="window.location.href='../index3.html'" />
</div>

# 作业提交
<body>
<form id="form1" name="form1" method="post" action="">
  <label for="1">学号：</label>
  <input name="1" type="text" id="1" value="221301100" />
</form>

<form id="form2" name="form2" method="post" action="">
  <label for="2">姓名：</label>
  <input name="2" type="text" id="2" value="某某某" />
</form>

<form id="form3" name="form3" method="post" action="">
  <label for="3">专业：</label>
  <input name="3" type="text" id="3" value="智能科学与技术" />
</form>

<form id="form4" name="form4" method="post" action="">
  <label for="4">课程：</label>
  <input name="4" type="text" id="4" value="神经网络与深度学习" />
</form>

<form id="form5" name="form5" enctype="multipart/form-data" method="post" action="">
  <label for="5">文件：   </label>
  <input type="file" name="5" id="5" />
 </form>

<form id="form6" name="form6" method="post" action="">
  提交：
  <input type="submit" name="6" id="6" value="提交文件" onclick="alert('开发中，敬请期待！...')" />
 </form>
</body>

# 人工智能学院-教室、实验室、会议室-预定系统！
<div align="center">
<input type="button" name="7" id="7" style="background-color: red; color: white; font-size: 18px; padding: 10px 20px;" value="会议室预定系统！" onclick="window.location.href='../index5.html'" />
</div>

# 考试提示系统！
<div align="center">
<input type="button" name="7" id="7" style="background-color: red; color: white; font-size: 18px; padding: 10px 20px;" value="考试提示系统！" onclick="window.location.href='../examapp.html'" />
</div>

# 张俊的课程资源

## 自动控制原理（23级智能科学与技术专业本科生）

1. 教材PDF                    [https://www.lanzoub.com/iiBo51lh7ptg](https://www.lanzoub.com/iiBo51lh7ptg)
2. PPT                        [https://wwi.lanzoup.com/iyEBW20pv9dg](https://wwi.lanzoup.com/iyEBW20pv9dg)
3. 控制理论MATLAB教程.pdf      [https://wwi.lanzoup.com/inmvf1lh88fg](https://wwi.lanzoup.com/inmvf1lh88fg)

## 神经网络与深度学习（24级智能科学与技术、工业智能专业本科生）

1. 教材PDF                        [https://wwi.lanzoup.com/isO9O08c83xa](https://wwi.lanzoup.com/isO9O08c83xa)
2. Python入门 PPT                 [https://wwi.lanzoup.com/i26pD08c83zc](https://wwi.lanzoup.com/i26pD08c83zc)
3. 第1章 绪论 PPT                  [https://wwi.lanzoup.com/ipC6N15kj1vi](https://wwi.lanzoup.com/ipC6N15kj1vi)
4. 第2章 人工神经网络建模基础 PPT    [https://wwi.lanzoup.com/ikj4W08c843g](https://wwi.lanzoup.com/ikj4W08c843g)
5. 第3章 感知器神经网络 PPT         [https://wwi.lanzoup.com/izPJY08c845i](https://wwi.lanzoup.com/izPJY08c845i)
6. 第5章 径向基函数神经网络 PPT      [https://wwi.lanzoup.com/irxAY08c846j](https://wwi.lanzoup.com/irxAY08c846j)
7. 第6章 反馈神经网络 PPT           [https://wwi.lanzoup.com/iJpGh08c847a](https://wwi.lanzoup.com/iJpGh08c847a)
8. 第8章 深度神经网络 PPT           [https://wwi.lanzoup.com/iY75608c849c](https://wwi.lanzoup.com/iY75608c849c)
9. 第8章 深度神经网络—堆栈式自动编码器 PPT  [https://wwi.lanzoup.com/iN90k08c84be](https://wwi.lanzoup.com/iN90k08c84be)
10. 第8章 深度神经网络—受限玻尔兹曼机 PPT   [https://wwi.lanzoup.com/i45dH08c84fi](https://wwi.lanzoup.com/i45dH08c84fi)
11. 第8章 深度神经网络—卷积神经网络 PPT     [https://wwi.lanzoup.com/iIAaG0i4ryba](https://wwi.lanzoup.com/iIAaG0i4ryba)
12. 第9章  支持向量机基本原理 PPT          [https://wwi.lanzoup.com/iiaAb0i15nsb](https://wwi.lanzoup.com/iiaAb0i15nsb)]
13. 《神经网络与深度学习》上机指导书PDF      [https://wwi.lanzoup.com/iecrc08c868d](https://wwi.lanzoup.com/iecrc08c868d)
14. 沈阳工业大学实验报告(计算机程序设计类)    [https://wwi.lanzoup.com/iEcxn08c86ch](https://wwi.lanzoup.com/iEcxn08c86ch)
15. 数学基础PDF                    [https://wwi.lanzoup.com/iPZOR08c86af](https://wwi.lanzoup.com/iPZOR08c86af)
16. 参考书文件夹PDF                 [https://wwi.lanzoup.com/b011utjof](https://wwi.lanzoup.com/b011utjof)   密码:8jif
17. Pycharm_2020.2   [https://pan.baidu.com/s/147mqO_oPQy3VhwCclMD7Dw?pwd=lrgr](https://pan.baidu.com/s/147mqO_oPQy3VhwCclMD7Dw?pwd=lrgr)
18. Pycharm_2020.2激活包   [https://pan.baidu.com/s/1yWBgTj5Yj3j8oYTUZdwJSQ?pwd=kaqf](https://pan.baidu.com/s/1yWBgTj5Yj3j8oYTUZdwJSQ?pwd=kaqf)
19. Pycharm_2023安装包与激活   [https://pan.baidu.com/s/1ZApmSs5zVBNXwOTUx_EpYQ?pwd=57zt](https://pan.baidu.com/s/1ZApmSs5zVBNXwOTUx_EpYQ?pwd=57zt)
18. Anaconda3-2024.06-1-Windows-x86_64安装包   [https://pan.baidu.com/s/10w0IglXCHt8v6qqCns_zdw?pwd=be1e](https://pan.baidu.com/s/10w0IglXCHt8v6qqCns_zdw?pwd=be1e)
19. vscode1.87.2安装包   [https://wwfz.lanzouv.com/is57v2aqy5gj](https://wwfz.lanzouv.com/is57v2aqy5gj)
20. python3.12.4安装包   [https://wwfz.lanzouv.com/iMM822aqy46d](https://wwfz.lanzouv.com/iMM822aqy46d)
21. python3.11.3安装包   [https://wwfz.lanzouv.com/i8ikG2aqy3xe](https://wwfz.lanzouv.com/i8ikG2aqy3xe)
20. python3.10.4安装包   [https://wwfz.lanzouv.com/iGzMG2aqy3qh](https://wwfz.lanzouv.com/iGzMG2aqy3qh)
21. python3.9.1安装包   [https://wwfz.lanzouv.com/iD3yd2aqy3gh](https://wwfz.lanzouv.com/iD3yd2aqy3gh)
22. python3.8.5安装包   [https://wwfz.lanzouv.com/i4WY92aqy38j](https://wwfz.lanzouv.com/i4WY92aqy38j)
23. python3.7.9安装包   [https://wwfz.lanzouv.com/iW3s22aqy2yj](https://wwfz.lanzouv.com/iW3s22aqy2yj)
24. python3.6.4安装包   [https://wwfz.lanzouv.com/iE59a2aqy2te](https://wwfz.lanzouv.com/iE59a2aqy2te)

## 计算机控制系统（25级控制工程专业研究生）

1. 教材pdf                       [https://wwi.lanzoup.com/iVDHI08cbgpi](https://wwi.lanzoup.com/iVDHI08cbgpi)
2. chap1_计算机控制系统概述        [https://wwi.lanzoup.com/ivcdx0aaklah](https://wwi.lanzoup.com/ivcdx0aaklah)
3. chap2_信号转换与z变换           [https://wwi.lanzoup.com/iC0BO0aaklbi](https://wwi.lanzoup.com/iC0BO0aaklbi)
4. chap3_数学描述与性能分析         [https://wwi.lanzoup.com/ibgCf0aaklda](https://wwi.lanzoup.com/ibgCf0aaklda)
5. chap4_模拟化设计方法            [https://wwi.lanzoup.com/isf5z0aaklfc](https://wwi.lanzoup.com/isf5z0aaklfc)
6. chap5_直接设计方法              [https://wwi.lanzoup.com/iegfB0aaklhe](https://wwi.lanzoup.com/iegfB0aaklhe)
7. chap6_极点配置设计方法           [https://wwi.lanzoup.com/iAwU10aakljg](https://wwi.lanzoup.com/iAwU10aakljg)
8. chap7_先进控制规律的设计方法      [https://wwi.lanzoup.com/imrd30aaklkh](https://wwi.lanzoup.com/imrd30aaklkh)
9. 课后习题参考答案                 [https://wwi.lanzoup.com/iFtO20bp0evc](https://wwi.lanzoup.com/iFtO20bp0evc) 
10. matlab R2016b   [https://pan.baidu.com/s/1RlT2DVUtFCeExRtHrwoYPQ?pwd=zmuw](https://pan.baidu.com/s/1RlT2DVUtFCeExRtHrwoYPQ?pwd=zmuw)
11. matlab R2021a   [https://pan.baidu.com/s/1tpXTHPiqgKiu2w3uqTtjBA?pwd=p7yz](https://pan.baidu.com/s/1tpXTHPiqgKiu2w3uqTtjBA?pwd=p7yz)
12. matlab R2023b   [https://pan.baidu.com/s/1XLUOoRVMoposO2H9ZMDNtw?pwd=u8zt](https://pan.baidu.com/s/1XLUOoRVMoposO2H9ZMDNtw?pwd=u8zt)
13. matlab R2024a   [https://pan.baidu.com/s/1ahC_b4lUopp5SiBUgvmH1A?pwd=ow7u](https://pan.baidu.com/s/1ahC_b4lUopp5SiBUgvmH1A?pwd=ow7u)
14. matlab R2021a MAC  [https://pan.baidu.com/s/1QkMNaMm_STjYmasG5nf4zw?pwd=h6fg](https://pan.baidu.com/s/1QkMNaMm_STjYmasG5nf4zw?pwd=h6fg)

## 神经网络与强化学习（25级研究生）

1. 教材pdf                    [https://wwi.lanzoup.com/ifU7k08cbjmd](https://wwi.lanzoup.com/ifU7k08cbjmd)
2. Python入门 PPT             [https://wwfz.lanzouv.com/iKNKH2aqzgbg](https://wwfz.lanzouv.com/iKNKH2aqzgbg)
3. 数学基础PDF                 [https://wwi.lanzoup.com/iPZOR08c86af](https://wwi.lanzoup.com/iPZOR08c86af)
4. chap01-绪论 PPT             [https://wwfz.lanzouv.com/iDLW02aqzgqb](https://wwfz.lanzouv.com/iDLW02aqzgqb)
5. chap02-机器学习概述 PPT      [https://wwfz.lanzouv.com/is9SN2aqzguf](https://wwfz.lanzouv.com/is9SN2aqzguf)
6. chap03-线性模型 PPT         [https://wwfz.lanzouv.com/iVACQ2aqzgxi](https://wwfz.lanzouv.com/iVACQ2aqzgxi)
7. chap04-前馈神经网络 PPT      [https://wwfz.lanzouv.com/iby5c2aqzh2d](https://wwfz.lanzouv.com/iby5c2aqzh2d)
8. chap05-卷积神经网络 PPT      [https://wwfz.lanzouv.com/iHwfF2aqzhta](https://wwfz.lanzouv.com/iHwfF2aqzhta)
9. chap06-循环神经网络 PPT      [https://wwi.lanzoup.com/ijGHn08cbkyb](https://wwi.lanzoup.com/ijGHn08cbkyb)
10. chap14-深度强化学习 PPT      [https://wwfz.lanzouv.com/iw1Je2aqzi2j](https://wwfz.lanzouv.com/iw1Je2aqzi2j)
11. 参考书文件夹PDF             [https://wwi.lanzoup.com/b011utjof](https://wwi.lanzoup.com/b011utjof)   密码:8jif
12. Pycharm_2020.2   [https://pan.baidu.com/s/147mqO_oPQy3VhwCclMD7Dw?pwd=lrgr](https://pan.baidu.com/s/147mqO_oPQy3VhwCclMD7Dw?pwd=lrgr)
13. Pycharm_2020.2激活包   [https://pan.baidu.com/s/1yWBgTj5Yj3j8oYTUZdwJSQ?pwd=kaqf](https://pan.baidu.com/s/1yWBgTj5Yj3j8oYTUZdwJSQ?pwd=kaqf)
14. Pycharm_2023安装包与激活   [https://pan.baidu.com/s/1ZApmSs5zVBNXwOTUx_EpYQ?pwd=57zt](https://pan.baidu.com/s/1ZApmSs5zVBNXwOTUx_EpYQ?pwd=57zt)
15. Anaconda3-2024.06-1-Windows-x86_64安装包   [https://pan.baidu.com/s/10w0IglXCHt8v6qqCns_zdw?pwd=be1e](https://pan.baidu.com/s/10w0IglXCHt8v6qqCns_zdw?pwd=be1e)
16. vscode1.87.2安装包   [https://wwfz.lanzouv.com/is57v2aqy5gj](https://wwfz.lanzouv.com/is57v2aqy5gj)
17. python3.12.4安装包   [https://wwfz.lanzouv.com/iMM822aqy46d](https://wwfz.lanzouv.com/iMM822aqy46d)
18. python3.11.3安装包   [https://wwfz.lanzouv.com/i8ikG2aqy3xe](https://wwfz.lanzouv.com/i8ikG2aqy3xe)
19. python3.10.4安装包   [https://wwfz.lanzouv.com/iGzMG2aqy3qh](https://wwfz.lanzouv.com/iGzMG2aqy3qh)
20. python3.9.1安装包   [https://wwfz.lanzouv.com/iD3yd2aqy3gh](https://wwfz.lanzouv.com/iD3yd2aqy3gh)
21. python3.8.5安装包   [https://wwfz.lanzouv.com/i4WY92aqy38j](https://wwfz.lanzouv.com/i4WY92aqy38j)
22. python3.7.9安装包   [https://wwfz.lanzouv.com/iW3s22aqy2yj](https://wwfz.lanzouv.com/iW3s22aqy2yj)
23. python3.6.4安装包   [https://wwfz.lanzouv.com/iE59a2aqy2te](https://wwfz.lanzouv.com/iE59a2aqy2te)

## 深度学习理论及应用（25级人工智能学院博士研究生）

1. 教材pdf                    [https://wwi.lanzoup.com/ifU7k08cbjmd](https://wwi.lanzoup.com/ifU7k08cbjmd)
2. Python入门 PPT             [https://wwi.lanzoup.com/i26pD08c83zc](https://wwi.lanzoup.com/i26pD08c83zc)
3. 数学基础PDF                 [https://wwi.lanzoup.com/iPZOR08c86af](https://wwi.lanzoup.com/iPZOR08c86af)
4. chap01-绪论 PPT             [https://wwi.lanzoup.com/iZwi308cbjxe](https://wwi.lanzoup.com/iZwi308cbjxe)
5. chap02-机器学习概述 PPT      [https://wwi.lanzoup.com/itHeD08cbk5c](https://wwi.lanzoup.com/itHeD08cbk5c)
6. chap03-线性模型 PPT         [https://wwi.lanzoup.com/i0oT308cbkeb](https://wwi.lanzoup.com/i0oT308cbkeb)
7. chap04-前馈神经网络 PPT      [https://wwi.lanzoup.com/imTV508cbkkh](https://wwi.lanzoup.com/imTV508cbkkh)
8. chap05-卷积神经网络 PPT      [https://wwi.lanzoup.com/iqiet0i4s1mj](https://wwi.lanzoup.com/iqiet0i4s1mj)
9. chap06-循环神经网络 PPT      [https://wwi.lanzoup.com/ijGHn08cbkyb](https://wwi.lanzoup.com/ijGHn08cbkyb)
10. 参考书文件夹PDF             [https://wwi.lanzoup.com/b011utjof](https://wwi.lanzoup.com/b011utjof)   密码:8jif
11. Pycharm_2020.2   [https://pan.baidu.com/s/147mqO_oPQy3VhwCclMD7Dw?pwd=lrgr](https://pan.baidu.com/s/147mqO_oPQy3VhwCclMD7Dw?pwd=lrgr)
12. Pycharm_2020.2激活包   [https://pan.baidu.com/s/1yWBgTj5Yj3j8oYTUZdwJSQ?pwd=kaqf](https://pan.baidu.com/s/1yWBgTj5Yj3j8oYTUZdwJSQ?pwd=kaqf)


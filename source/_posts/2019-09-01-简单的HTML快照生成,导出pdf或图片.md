---
title: 简单的HTML快照生成,导出pdf或图片
date: 2019-09-01 10:00:00
categories:
- javascript
---

### 一、利用 html2canvas实现HTML页面截图

> 官方网址：[ https://html2canvas.hertzen.com/ ]( https://html2canvas.hertzen.com/ )
>
> GitHub：[https://github.com/niklasvh/html2canvas](https://github.com/niklasvh/html2canvas)

#### 1.HTML页面引入 `html2canvas.min.js` 
#### 2.定义一个截图的触发按钮

```html
 <button onclick="exprotImg();">导出图片</button> 
 <a href="" download="canvas.png" id="save_href" style="display:none">
        <img src="" id="save_img"/>
  </a>
```

#### 3.js代码

```javascript
function exprotImg() {
    // 要截图的元素
    var element = document.getElementsByTagName('html')[0];
    // 获取元素的大小及其相对于视口的位置等参数
    var dd= element.getBoundingClientRect();

    var opts = {
        scale: 2, // 添加的scale 参数
        // logging: true, //日志开关，便于查看html2canvas的内部执行流程
        width: dd.width, //dom 原始宽度
        height: dd.height,
        useCORS: true, // 【重要】开启跨域配置
         allowTaint:true
    };

    html2canvas(element,opts).then(function(canvas) {
        // 模拟的下载按钮
        var svaeHref = document.getElementById("save_href");
        var img = document.getElementById("save_img");
        var tempSrc = canvas.toDataURL("image/png");
        svaeHref.href=tempSrc;
        img.src=tempSrc;
        $(img).click();
    });
}
```



### 二、利用  html2pdf 实现页面导出pdf

> GitHub ：[https://github.com/eKoopmans/html2pdf](https://github.com/eKoopmans/html2pdf) 

#### 1.页面导入 `html2pdf.bundle.min.js` 

#### 2.导出按钮

```html
<button onclick="exprotPdf();">导出pdf</button>
```

#### 3.js代码 

```javascript
function exprotPdf() {
    // 要截图的元素
    var element = document.getElementsByTagName('html')[0];
    // 获取元素的大小及其相对于视口的位置等参数
    var opt = {
        margin:  1,
        filename:  'myfile.pdf',
        image:   { type: 'png', quality: 0.98 },
        html2canvas:  {
            scale: 2,
            useCORS:true, // 【重要】开启跨域配置
            allowTaint:true,
            width:dd.width,
            height:dd.height
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();

}
```
# 绘制形状
```js
//直接绘制矩形
ctx.fillRect(x, y, width, height)
ctx.strokeRect(x, y, width, height)
ctx.clearRect(x, y, width, height)
```
```js
//路径的通用操作
ctx.beginPath()
ctx.closePath()
ctx.stroke()
ctx.fill(rule) //rule: nonzero evenodd
```
```js
//绘制路径
ctx.moveTo(x, y)
ctx.lineTo(x, y)
ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise)
ctx.rect(x, y, width, height)
ctx.quadraticCurveTo(cp1x, cp1y, x, y)
ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
```
```js
//储存合并路径
new Path2D()
Path2D.prototype.addPath(path[, transform]) //chrome尚未实现
```

# 样式与颜色

```js
//画笔的颜色
ctx.fillStyle
ctx.strokeStyle
ctx.globalAlpha
```
```js
//画笔的线型
ctx.lineWidth // default 1.0
ctx.lineCap // butt(default) round square
ctx.lineJoin // round bevel miter(default)
ctx.miterLimit
ctx.getLineDash()
ctx.setLineDash(segments)
ctx.lineDashOffset
```
```js
//创建渐变
ctx.createLinearGradient(x1, y1, x2, y2)
ctx.createRadialGradient(x1, y1, r1, x2, y2, r2)
gradient.addColorStop(position, color)
```
```js
//创建图案
ctx.createPattern(image, type)
```
```js
//阴影
ctx.shadowOffsetX
ctx.shadowOffsetY
ctx.shadowBlur
ctx.shadowColor
```
# 绘制文字
```js
ctx.font //设定字号、字体
ctx.textAlign //start(default), end, left, right, center
ctx.textBaseLine //top, hanging, middle, alphabetic(default), ideographic, bottom
ctx.direction //ltr, rtl, inherit(default)
ctx.fillText(text, x, y[, maxWidth])
ctx.strokeText(text, x, y[, maxWidth])
ctx.measureText(String tomeasure) //测量文本
```  
# 应用图像
```js
/**
 * 可以使用的源有：HTMLImageElement HTMLVideoElement HTMLCanvasElement ImageBitmap
 * 注意所使用的源image必须是已经加载完的，所以需要进行预加载处理
 */
ctx.drawImage(image, x, y, width, height)
//or
ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) //切片
```
# 变形
```js
/**
 * 状态包括三个方面：
 * 当前应用的变形(移动,旋转,缩放)
 * strokeStyle, fillStyle, globalAlpha, lineWith, lineCap, lineJoin, miterLimit, shadowOffsetX, shadowOffsetY, shadowBlur, shadowColor, globalCompositeOperation的值
 * clipping path
 */
ctx.save() //保存状态
ctx.restore() //恢复状态
//移动
ctx.translate(x, y)

```
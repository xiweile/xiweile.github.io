---
title: springcloud zuul实践：自定义异常过滤器，统一异常响应格式
date: 2019-09-13 10:00:00
categories:
- springcloud
---

在springcloud项目中，网关发生异常时，响应内容并不是我们想要的格式，内容如下：
```json
{
  "timestamp": 1481674980376,
  "status": 500,
  "error": "Internal Server Error",
  "exception": "java.lang.RuntimeException",
  "message": "Exist some errors..."
}
```
上面的json则是内置异常过滤器封装的一种格式。我们现在想要修改她，就需要自定义异常过滤器。 
- 首先继承抽象类`ZuulFilter `，实现`filterType()`，`filterOrder()`，`shouldFilter()`， `run()`四个抽象方法。前三个方法均使用父方法逻辑。仅修改`run()`中部分内容，主体逻辑步骤依然参考`SendErrorFilter`。
- 方法`run()`中重新定义异常响应格式，将自定义的响应体，设置到原有的响应中。
- 停用内置的默认异常处理器`SendErrorFilter`，在application.yml中设置`zuul.SendErrorFilter.error.disable: true`。
- `CustomSendErrorFilter `在内置的默认异常处理器失效时生效。设置注解`ConditionalOnProperty`属性name=`"zuul.SendErrorFilter.error.disable"`。

过滤器详细介绍可参考往期文章：[springcloud zuul源码分析：内置过滤器](https://blog.csdn.net/xiweiller/article/details/100772775)


下面是案例代码：

```java
@Component
@ConditionalOnProperty(name="zuul.SendErrorFilter.error.disable")
public class CustomSendErrorFilter extends SendErrorFilter {
    @Override
    public String filterType() {
        return super.filterType();
    }

    @Override
    public int filterOrder() {
        return super.filterOrder();
    }

    @Override
    public boolean shouldFilter() {
        return super.shouldFilter();
    }

    @Override
    public Object run() {

        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletResponse response = ctx.getResponse();
        try {
            int responseStatusCode = ctx.getResponseStatusCode();
            // 此处自定义响应体start
            String cumstomBody = "{}";//内容省略...
  			// 此处自定义响应体end
            response.setStatus(ctx.getResponseStatusCode());
            response.setContentType(MediaType.APPLICATION_JSON_UTF8_VALUE);
            response.getOutputStream().write(cumstomBody.getBytes());
        } catch (IOException e) {
            ReflectionUtils.rethrowRuntimeException(e);
        } finally {
            ThreadLocalUtil.remove();
        }
        return null;
    }
}

```
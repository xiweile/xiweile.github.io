---
title: springcloud zuul实践：自定义前置过滤器进行权限认证
date: 2019-09-11 10:00:00
categories:
- springcloud
---

在springcloud项目中，权限认证逻辑一般放在请求路由之前，如果认证通过，则会执行route类型的过滤器，访问微服务获取数据。如果认证未通过，则要设置不进行路由，从而直接响应给客户端。

过滤器详细介绍可参考往期文章：[springcloud zuul源码分析：内置过滤器](https://blog.csdn.net/xiweiller/article/details/100772775)

因此，我们通过自定义一个前置过滤器，来实现权限认证的逻辑。
- 首先继承抽象类`ZuulFilter `，实现`filterType()`，`filterOrder()`，`shouldFilter()`， `run()`四个抽象方法。
- `filterType()` 返回 `"pre"`定义过滤器为前置过滤器。
- 方法`run()`中是执行逻辑，`RequestContext.getCurrentContext()`获取当前上下文实例`ctx`，如果认证不通过，可设置`ctx.setSendZuulResponse(false)`阻止请求进行路由。
- 前置过滤器内也可以对请求参数进行修改或添加。

下面是案例代码：

```java
@Component
public class AccessFilter extends ZuulFilter {
 
	/**
	 * 返回一个字符串代表过滤器的类型，在zuul中定义了四种不同生命周期的过滤器类型： 
	 * pre：可以在请求被路由之前调用
	 * route：在路由请求时候被调用 
	 * post：在route和error过滤器之后被调用 
	 * error：处理请求时发生错误时被调用
	 * 
	 * @return
	 */
	@Override
	public String filterType() {
		return "pre"; // 前置过滤器
	}

	@Override
	public int filterOrder() {
		return 2; // 过滤器的执行顺序，数字越大优先级越低
	}

	@Override
	public boolean shouldFilter() {
		return true;// 是否执行该过滤器，此处为true，说明需要过滤
	}

	@Override
	public Object run() {
		RequestContext ctx = RequestContext.getCurrentContext();
		HttpServletRequest request = ctx.getRequest();
		HttpServletResponse response = ctx.getResponse();
	 
		// 访问权限认证逻辑
		boolean result = this.exeAuth(request);
		if(result ==true){//通过校验
			// 添加额外的请求参数为可选逻辑...
			// 添加额外的请求参数start
			Map<String, List<String>> requestQueryParams = ctx.getRequestQueryParams();
			List<String> params = new ArrayList<String>();
			params.add("otherParamValue");
			requestQueryParams.put("otherParamKey",params);
			ctx.setRequestQueryParams(requestQueryParams);
			// 添加额外的请求参数end
			
		}else{//校验未通过
			ctx.setSendZuulResponse(false); // 过滤该请求，不进行路由
			ctx.setResponseStatusCode(HttpStatus.UNAUTHORIZED.value());
			ctx.setResponseBody(JSON.toJSONString(res)); // 返回前端内容
			response.setContentType(MediaType.APPLICATION_JSON_UTF8_VALUE);
		}

		return null;
	}
	
	/**
	 * 认证逻辑
	 * 
	 * @return
	 * @throws ZuulException
	 */
	public boolean exeAuth(HttpServletRequest request){
		// 详细认证逻辑...
		// 省略...
		return false;
	}
}
```
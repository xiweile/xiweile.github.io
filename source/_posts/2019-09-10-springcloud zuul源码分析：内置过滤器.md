---
title: springcloud zuul源码分析：内置过滤器
date: 2019-09-10 15:00:00
categories:
- springcloud
---

springcloud项目中我们常常使用zuul作为网关，用它做一些路由分发、权限校验、统一异常处理、日志收集等等工作。而实现这些功能的重要组件就是它的过滤器`ZuulFilter`，本篇文章介绍zuul中内置过滤器。

### 1.ZuulFilter介绍
我们自定义的每个过滤器都需要继承ZuulFilter才能被加载生效。它有四个重要的抽象方法需要重写。
```java
    public abstract String filterType();

    public abstract int filterOrder();

    boolean shouldFilter();

    Object run();
```
四个方法介绍：
- `filterType` 返回值标识过滤器类型。
	- `pre` 在请求被路由之前调用。
	- `routing`	路由时被调用。
	- `post`	在routing或error过滤器之后被调用。
	- `error` 在请求发送异常时被调用。
- `filterOrder` 返回int值标识过滤器执行顺序，数值越小优先级越高。
- `shouldFilter` 返回boolean类型确定是否执行该过滤器。

### 2.内置过滤器介绍
#### 1）按filterType分类图示
![zuul核心过滤器按filterType分类](https://img-blog.csdnimg.cn/20190912154343155.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3hpd2VpbGxlcg==,size_16,color_FFFFFF,t_70)
#### 2）各过滤器功能详细介绍
##### pre过滤器
- `ServletDetectionFilter`：它的执行顺序为-3，是最先被执行的过滤器。该过滤器总是会被执行，主要用来检测当前请求是通过Spring的DispatcherServlet处理运行，还是通过ZuulServlet来处理运行的。它的检测结果会以布尔类型保存在当前请求上下文的`isDispatcherServletRequest`参数中，这样在后续的过滤器中，我们就可以通过`RequestUtils.isDispatcherServletRequest()`和`RequestUtils.isZuulServletRequest()`方法判断它以实现做不同的处理。一般情况下，发送到API网关的外部请求都会被Spring的DispatcherServlet处理，除了通过/zuul/路径访问的请求会绕过DispatcherServlet，被ZuulServlet处理，主要用来应对处理大文件上传的情况。另外，对于ZuulServlet的访问路径/zuul/，我们可以通过`zuul.servletPath`参数来进行修改。
- `Servlet30WrapperFilter`：它的执行顺序为-2，是第二个执行的过滤器。目前的实现会对所有请求生效，主要为了将原始的HttpServletRequest包装成Servlet30RequestWrapper对象。
- `FormBodyWrapperFilter`：它的执行顺序为-1，是第三个执行的过滤器。该过滤器仅对两种类请求生效，第一类是Content-Type为`application/x-www-form-urlencoded`的请求，第二类是Content-Type为`multipart/form-data`并且是由Spring的DispatcherServlet处理的请求（用到了ServletDetectionFilter的处理结果）。而该过滤器的主要目的是将符合要求的请求体包装成FormBodyRequestWrapper对象。
- `DebugFilter`：它的执行顺序为1，是第四个执行的过滤器。该过滤器会根据配置参数`zuul.debug.request`和请求中的debug参数来决定是否执行过滤器中的操作。而它的具体操作内容则是将当前的请求上下文中的`debugRouting`和`debugRequest`参数设置为true。由于在同一个请求的不同生命周期中，都可以访问到这两个值，所以我们在后续的各个过滤器中可以利用这两值来定义一些debug信息，这样当线上环境出现问题的时候，可以通过请求参数的方式来激活这些debug信息以帮助分析问题。另外，对于请求参数中的debug参数，我们也可以通过`zuul.debug.parameter`来进行自定义。
- `PreDecorationFilter`：它的执行顺序为5，是pre阶段最后被执行的过滤器。该过滤器会判断当前请求上下文中是否存在`forward.to`和`serviceId`参数，如果都不存在，那么它就会执行具体过滤器的操作（如果有一个存在的话，说明当前请求已经被处理过了，因为这两个信息就是根据当前请求的路由信息加载进来的）。而它的具体操作内容就是为当前请求做一些预处理，比如：进行路由规则的匹配、在请求上下文中设置该请求的基本信息以及将路由匹配结果等一些设置信息等，这些信息将是后续过滤器进行处理的重要依据，我们可以通过`RequestContext.getCurrentContext()`来访问这些信息。另外，我们还可以在该实现中找到一些对HTTP头请求进行处理的逻辑，其中包含了一些耳熟能详的头域，比如：`X-Forwarded-Host`、`X-Forwarded-Port`。另外，对于这些头域的记录是通过zuul.addProxyHeaders参数进行控制的，而这个参数默认值为true，所以Zuul在请求跳转时默认地会为请求增加X-Forwarded-*头域，包括：`X-Forwarded-Host`、`X-Forwarded-Port`、`X-Forwarded-For`、`X-Forwarded-Prefix`、`X-Forwarded-Proto`。我们也可以通过设置`zuul.addProxyHeaders=false`关闭对这些头域的添加动作。

##### route过滤器
- `RibbonRoutingFilter`：它的执行顺序为10，是route阶段第一个执行的过滤器。该过滤器只对请求上下文中存在serviceId参数的请求进行处理，即只对通过`serviceId`配置路由规则的请求生效。而该过滤器的执行逻辑就是面向服务路由的核心，它通过使用Ribbon和Hystrix来向服务实例发起请求，并将服务实例的请求结果返回。
- `SimpleHostRoutingFilter`：它的执行顺序为100，是route阶段第二个执行的过滤器。该过滤器只对请求上下文中存在`routeHost`参数的请求进行处理，即只对通过url配置路由规则的请求生效。而该过滤器的执行逻辑就是直接向routeHost参数的物理地址发起请求，从源码中我们可以知道该请求是直接通过`httpclient`包实现的，而没有使用`Hystrix`命令进行包装，所以这类请求并没有线程隔离和断路器的保护。
- `SendForwardFilter`：它的执行顺序为500，是route阶段第三个执行的过滤器。该过滤器只对请求上下文中存在`forward.to`参数的请求进行处理，即用来处理路由规则中的forward本地跳转配置。
##### post过滤器
- `SendErrorFilter`：它的执行顺序为0，是post阶段第一个执行的过滤器。该过滤器仅在请求上下文中包含`error.status_code`参数（由之前执行的过滤器设置的错误编码）并且还没有被该过滤器处理过的时候执行。而该过滤器的具体逻辑就是利用请求上下文中的错误信息来组织成一个forward到API网关`/error`错误端点的请求来产生错误响应。
- `SendResponseFilter`：它的执行顺序为1000，是post阶段最后执行的过滤器。该过滤器会检查请求上下文中是否包含请求响应相关的头信息、响应数据流或是响应体，只有在包含它们其中一个的时候就会执行处理逻辑。而该过滤器的处理逻辑就是利用请求上下文的响应信息来组织需要发送回客户端的响应内容。

### 网关过滤器执行逻辑
源码逻辑
```java
public class ZuulServlet extends HttpServlet {
    private ZuulRunner zuulRunner;

    public ZuulServlet() {
    }

    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        String bufferReqsStr = config.getInitParameter("buffer-requests");
        boolean bufferReqs = bufferReqsStr != null && bufferReqsStr.equals("true");
        this.zuulRunner = new ZuulRunner(bufferReqs);
    }
    
    public void service(ServletRequest servletRequest, ServletResponse servletResponse) throws ServletException, IOException {
      		// 省略....   
 			try {
                this.preRoute();
            } catch (ZuulException var13) {
                this.error(var13);
                this.postRoute();
                return;
            }
            try {
                this.route();
            } catch (ZuulException var12) {
                this.error(var12);
                this.postRoute();
                return;
            }
            try {
                this.postRoute();
            } catch (ZuulException var11) {
                this.error(var11);
            }
         // 省略....   
    }     
    void postRoute() throws ZuulException {
        this.zuulRunner.postRoute();
    }

    void route() throws ZuulException {
        this.zuulRunner.route();
    }

    void preRoute() throws ZuulException {
        this.zuulRunner.preRoute();
    }

    void init(HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        this.zuulRunner.init(servletRequest, servletResponse);
    }

    void error(ZuulException e) {
        RequestContext.getCurrentContext().setThrowable(e);
        this.zuulRunner.error();
    }
}
```
**流程分析**：
请求经ZuulServlet 进入内部service处理方法，依次经过preRoute，route，postRoute三组过滤器，如果任何一个过滤器中发生异常都会转发到error过滤器，而error最终也会再次将结果转发postRoute，有postRoute负责将结果给返回客户端。

执行流程图如下:
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190912162242650.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3hpd2VpbGxlcg==,size_16,color_FFFFFF,t_70)
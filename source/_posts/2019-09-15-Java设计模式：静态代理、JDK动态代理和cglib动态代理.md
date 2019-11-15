---
title: Java设计模式：静态代理、JDK动态代理和cglib动态代理
date: 2019-09-15 10:00:00
categories:
- java
---

```java
静态代理、JDK动态代理和cglib动态代理
/**
 * 静态代理案例：增强猫(Cat的代理类)
 * 利用装饰者模式
 * 要求：1.委托类、代理类必须实现共同的接口 2.代理类需要获得委托类的对象的引用
 *
 * @author weiller
 * @version 1.0，2016-11-27 14:11:36
 */
public class StaticProxyDemo implements Jump{
	
	/** 委托类对象 */
	private Cat cat;
	
	/** 委托类对象作为参数传入构造方法 */
	public StaticProxyDemo(Cat cat){
		this.cat = cat;
	}
	
	@Override
	public void jump() {
		
		// 增强功能
		System.out.println("准备起跳...");
		// 原始方法调用
		cat.jump();
		// 增强功能
		System.out.println("回落...");
	}
}

/**
 * JDC动态代理案例
 * 要求：目标类必须实现一个接口
 * 
 * @author weiller
 * @version 1.0，2016-11-27 08:34:05
 */
public class JDKProxyDemo {
	
	/**
	 * 获得代理对象
	 * 
	 * @param t	目标类对象实现的接口
	 * @return	代理对象
	 */
	public static<T> T createProxyObject(T t){
		// 5.将被代理的对象修饰为final,便于匿名内部类使用
		final Object obj = t;
		// 2.获取被代理对象的类加载器
		ClassLoader loader = t.getClass().getClassLoader();
		// 3.获取被代理对象的所有实现接口 
		Class<?>[] interfaces = t.getClass().getInterfaces();
		// 4.创建调用处理对象
		InvocationHandler h = new InvocationHandler() {
			
			@Override
			public Object invoke(Object proxy, Method method, Object[] args)
					throws Throwable {
				// 7.增强功能
				System.out.println("开启事务...");
				// 6.原始方法调用
				Object ret = method.invoke(obj, args);
				// 增强功能
				System.out.println("关闭事务...");
				return ret;
			}
		};
		
		// 1.创建代理对象
		T proxyObject = (T) Proxy.newProxyInstance(loader, interfaces, h);
		
		return proxyObject;
	}
}

/**
 * cglib动态代理案例
 * cglib是针对类来实现代理的，他的原理是对指定的目标类生成一个子类，并覆盖其中方法实现增强。
 * 要求：CGLib由于是采用动态创建子类的方法，对于final方法，无法进行代理。
 * 
 * @author weiller
 * @version 1.0，2016-11-27 09:28:11
 */
public class CglibPorxyDemo<T> {
	
	public T createProxyObject(Class clazz){
		// 1.在内存中创建动态的增强类
		Enhancer enhancer = new Enhancer();
		// 2.为该增强类设置父类，与目标类形成继承关系。此类最终完成对原始方法的功能，同时对其功能进行加强。
		enhancer.setSuperclass(clazz);
		// 3.创建回调处理对象，对目标类的方法进行拦截
		Callback callback = new MethodInterceptor() {
			
			@Override
			/**
			 * obj:目标类的实例
			 * method:被拦截的方法对象
			 * args:调用参数
			 * methodProxy:代理方法的对象(通过JDK代理得到)
			 */
			public Object intercept(Object obj, Method method, Object[] args,
					MethodProxy methodProxy) throws Throwable {
				// 增强功能
				System.out.println("说相声...");
				//System.out.println(obj); // 调用obj产生死循环，溢栈。
				// 利用代理方法对象调用原始方法。注意：不能调用invoke()方法,否则产生死循环，溢栈。无法进行代理
				// 代理是通过多态的形式进行的。
				Object ret = methodProxy.invokeSuper(obj, args);
				return ret;
			}
		};
		
		// 4.设置回调
		enhancer.setCallback(callback);
		// 5.通过字节码技术动态创建该增强类的实例
		T newObject = (T) enhancer.create();
		
		return newObject;
	}
}

```
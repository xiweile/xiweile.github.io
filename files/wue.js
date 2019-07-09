var Wue = function (params) &#123;

    this.create = function()&#123;
        this.el = params.el;
        for (x in  params.data) &#123;
            this[x] = params.data[x];
        &#125;
        for (method in  params.methods) &#123;
            this[method] = params.methods[method];
        &#125;
    &#125;
    
    this.replaceModel= function (selector) &#123;
        var _this = this;
        var selector1 = "";
        // v-text ��ʽ
        if (selector) &#123;
            selector1 = this.el + " " + selector + " [v-text]";
        &#125; else &#123;
            selector1 = this.el + " [v-text]";
        &#125;

        this.replaceVText($(selector1), 'v-text');

        // v-value ��ʽ
        if (selector) &#123;
            selector12 = this.el + " " + selector + " [v-value]";
        &#125; else &#123;
            selector12 = this.el + " [v-value]";
        &#125;

        this.replaceVText($(selector12), 'v-value');

        // v-each ��ʽ
        var selector2 = "";
        if (selector) &#123;
            selector2 = this.el + " " + selector + " [v-each]";
        &#125; else &#123;
            selector2 = this.el + " [v-each]";
        &#125;

        $(selector2).each(function (i, item) &#123;
            var eachT = $(item).attr("v-each");
            var splitEachT = eachT.split("in");
            var itemName = $.trim(splitEachT[0]).split(",");
            var itemName1 = itemName[0];
            var itemName2 = "item";
            if (itemName.length > 1) &#123;
                itemName2 = itemName[1];
            &#125;
            var listName = $.trim(splitEachT[1]);


            var itemChildren = $(item).children();
            if (itemChildren.length >= 1) &#123;
                itemChildren = itemChildren[0];
                $(item).html("");
                $(item).append(itemChildren);
            &#125;
            var listValues = _this.getElValue(listName);
            console.log(listValues);
            if (listValues.length > 0) &#123;
                $.each(listValues, function (i2, item2) &#123;
                    var clone = $(itemChildren).clone();
                    var itexts = $(clone).find("[i-text]");
                    clone.show();
                    var obj = &#123;&#125;;
                    obj[itemName1] = item2;
                    obj[itemName2] = &#123;index: i2, num: i2 + 1, count: listValues.length&#125;;
                    _this.replaceVText(clone, 'i-text', obj);
                    _this.replaceVText(clone, 'i-value', obj);
                    _this.replaceVText(itexts, 'i-text', obj);
                    _this.replaceVText(itexts, 'i-value', obj);
                    _this.replaceEvent(clone,'i-click',obj);
                    _this.replaceEvent(itexts,'i-click',obj);
                    $(item).append(clone);
                &#125;);
            &#125;

        &#125;);

        // e-click ��ʽ
        var selector3 = "";
        if (selector) &#123;
            selector3 = this.el + " " + selector + " [e-click]";
        &#125; else &#123;
            selector3 = this.el + " [e-click]";
        &#125;
        this.replaceEvent($(selector3), "e-click");

    &#125;
    this.replaceEvent = function (els, key, obj) &#123;
        var _this = this;
        $.each(els, function (i, item) &#123;
            var text = $(item).attr(key);
            if(text)&#123;
                var method = text.substring(0,text.indexOf("("));
                var args =text.substring(text.indexOf("(")+1,text.indexOf(")")).split(",");
                $.each(args,function (x, arg) &#123;
                    args[x] = _this.getElValue(arg,obj);
                &#125;);
                switch (key) &#123;
                    case 'i-click':
                        $(item).click(function()&#123;
                            _this[method].apply(_this, args);
                        &#125;);
                        break;
                    case 'e-click':
                        $(item).click(function()&#123;
                            _this[method].apply(_this, args);
                        &#125;);
                        break;
                &#125;
            &#125;

        &#125;);
    &#125;
    this.replaceVText = function (els, key, obj) &#123;
        var _this = this;
        $.each(els, function (i, item) &#123;
            var text = $(item).attr(key);
            if(text)&#123;
                var hasEl = false;
                var result = "";
                var value = "";
                if (text.indexOf("&#123;&#123;") >= 0) &#123;
                    hasEl = true;
                &#125;else&#123;
                    result=text;
                &#125;
                while(hasEl)&#123;
                    var start = text.substring(0, text.indexOf("&#123;&#123;"));
                    var end = text.substring(text.indexOf("&#125;&#125;") + 2);
                    var vmodel = text.substring(text.indexOf("&#123;&#123;") + 2, text.indexOf("&#125;&#125;"));
                    value = _this.getElValue(vmodel, obj);
                    result = start + (value == undefined ? "-" : value) + end;
                    if(end.indexOf("&#123;&#123;") >= 0)&#123;// ������ڶ�����ʽ���������
                        hasEl = true;
                        text = result;
                    &#125;else&#123;
                        hasEl = false;
                    &#125;
                &#125;

                switch (key) &#123;
                    case 'i-text':
                        $(item).text(result);
                        break;
                    case 'v-text':
                        $(item).text(result);
                        break;
                    case 'i-value':
                        $(item).attr('value',result);
                        break;
                    case 'v-value':
                        $(item).attr('value',result);
                        break;
                &#125;
            &#125;

        &#125;);
    &#125;
    this.getElValue= function (vmodel, value) &#123;

        var vfun = "";
        if(vmodel.indexOf("(") >0)&#123;
            var v = vmodel.split("(");
            vmodel = v[1].substring(0,v[1].indexOf(")"));
            vfun =v[0];
            vfun = $.trim(vfun);
        &#125;
        vmodel = $.trim(vmodel);

        var split = vmodel.split("\.");
        if (!value) &#123;
            value = this;
        &#125;

        for (var x = 0; x < split.length; x++) &#123;
            if (value) &#123;
                value = value[split[x]];
            &#125;
        &#125;
        if(split.length===1 && value===undefined)&#123;// 如果全局也没有此model值则等于它本身
            value = eval(vmodel)
        &#125;

        // 判断是否存在函数运算
        if(value) &#123;
            if (vfun && vfun !== "") &#123;
                // 当前页面实例是否存在该函数
                if (this[vfun] && typeof this[vfun] === "function") &#123;
                    value = this[vfun](value);
                &#125; else &#123;
                    // 全局函数
                    value =  window[vfun](value);
                &#125;
            &#125;
        &#125;

        return value;
    &#125;

    this.create();

&#125;
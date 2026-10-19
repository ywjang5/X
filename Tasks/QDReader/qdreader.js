/**
 * 混淆核心代码还原 (QDReader Core)
 */
(function() {
    'use strict';

    // 运行环境检测与全局对象挂载
    var root = typeof window !== 'undefined' ? window : global;
    
    // 初始化 QDReader 阅读器核心命名空间
    var QDReader = root.QDReader || {};

    /**
     * 字体反混淆 / 动态映射解析模块
     * 主要用于起点阅读页中对动态混淆字体的映射还原
     */
    var FontDecoder = {
        // 动态混淆码表映射字典
        fontMap: {},
        
        // 初始化字体映射字典
        initMap: function(cipherObj) {
            if (!cipherObj || typeof cipherObj !== 'object') {
                return;
            }
            this.fontMap = cipherObj;
        },

        // 将加密内容替换为真实字符
        replaceContent: function(str) {
            if (!str) return '';
            var self = this;
            // 匹配私有字符区 (E000-F8FF) 或特定编码标识
            return str.replace(/[\uE000-\uF8FF]/g, function(char) {
                var code = char.charCodeAt(0).toString(16);
                return self.fontMap[code] || char;
            });
        }
    };

    /**
     * 请求签名与 Token 校验算法
     */
    var SecurityUtil = {
        sign: function(params, timestamp) {
            var keys = Object.keys(params).sort();
            var query = [];
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (k !== 'sign' && params[k] !== undefined && params[k] !== null) {
                    query.push(k + '=' + params[k]);
                }
            }
            query.push('ts=' + timestamp);
            var rawStr = query.join('&');
            
            // 内部摘要/哈希处理
            return this.hash(rawStr);
        },

        hash: function(input) {
            var h = 0, i, chr;
            if (input.length === 0) return h.toString(16);
            for (i = 0; i < input.length; i++) {
                chr = input.charCodeAt(i);
                h = ((h << 5) - h) + chr;
                h |= 0; // 转换为 32 位整型
            }
            return Math.abs(h).toString(16);
        }
    };

    /**
     * 章节内容解密与排版渲染
     */
    var ContentManager = {
        parseChapter: function(encryptedData, fontDict) {
            if (fontDict) {
                FontDecoder.initMap(fontDict);
            }
            
            // 过滤与解密段落
            var rawText = FontDecoder.replaceContent(encryptedData);
            return this.formatParagraphs(rawText);
        },

        formatParagraphs: function(content) {
            if (typeof content !== 'string') return [];
            var lines = content.split(/\r?\n+/);
            var paragraphs = [];
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line.length > 0) {
                    paragraphs.push('<p>' + line + '</p>');
                }
            }
            return paragraphs;
        }
    };

    // 暴露核心 API 接口
    QDReader.FontDecoder = FontDecoder;
    QDReader.SecurityUtil = SecurityUtil;
    QDReader.ContentManager = ContentManager;

    // 挂载至全局上下文
    root.QDReader = QDReader;

})(this);

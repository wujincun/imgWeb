/**
 * Created by Administrator on 2017/1/10.
 */
/*import "./flexible.js";
let $ = require("./jquery-1.12.1.min");*/

/*
 * 老虎机
 * */
var elevenGame = {
    flag: true,
    timer: null,
    num: 4,
    API: {
        getResultAjax: '/ajax/aj_springFestival002.php'
    },
    _init: function () {
        $('.chunk' + this.num).addClass('active');
        this._bind()
    },
    _bind: function () {
        var _this = this;
        var $gameArea = $('.slotMachineArea');
        var $startGame = $gameArea.find('.startGame');
        var $rotateRuleBtn = $('.rotateRuleBtn');
        var $popArea = $('.popArea');
        var $popMaterial = $popArea.find('.getMaterial');
        $startGame.on('click', function () {
            if (_this.flag) {
                _this.flag = false;
                $.ajax({
                    url: _this.API.getResultAjax,
                    type: "GET",
                    dataType: "json",
                    data: {}
                }).done(function (data) {
                    _this.dataProcess(data)
                });
            }
        });
        $popMaterial.on('click', ' .submitBtn', function () {
            var phoneNum = $popMaterial.find('.phoneInput').val().trim();
            var phoneHint = $popMaterial.find('.phoneHint');
            if (_this.checkPhone(phoneNum)) {
                $.ajax({
                    url: _this.API.getResultAjax,
                    type: "POST",
                    dataType: "json",
                    data: {
                        type: 'checkMobile',
                        mobile: phoneNum
                    }
                }).done(function (data) {
                    if(data.code == 200){
                        _this.sucOrFailHint('提交成功')
                    }else{
                        _this.sucOrFailHint('提交失败')
                    }
                })
            } else {
                phoneHint.show();
            }
        });
        $rotateRuleBtn.on('click', function () {
            $popArea.show();
            $popArea.find('.rotateRule').show().siblings().hide()
        });
        $popArea.on('click', '.popContent .close', function () {
            $popArea.hide();
        })
    },
    moveToDestination: function (obj) {
        var resultNum = obj.num, result = obj.result, _this = this, $popArea = $('.popArea'), $popMaterial = $popArea.find('.getMaterial');
        if (resultNum == _this.num) {
            _this.flag = true;
            if (Number(result)) {
                setTimeout(function () {
                    $popArea.show();
                    $popArea.find('.coupon .couponText span').text(result + '元');
                    $popArea.find('.coupon').show().siblings().hide();
                }, 300)
            } else {
                setTimeout(function () {
                    $popArea.show();
                    $popMaterial.find('.popBody .phoneInput').val(_this.mobile).attr('placeholder', _this.mobile);
                    $popMaterial.find('.popHead .subTitle').text('恭喜中奖' + result);
                    $popMaterial.show().siblings().hide();
                }, 300);
            }
        } else {
            _this.num++;
            var num = _this.num % 8 ? _this.num % 8 : 8;
            $('.chunk').removeClass('active');
            $('.chunk' + num).addClass('active');
            _this.timer = setTimeout(function () {
                _this.moveToDestination(obj)
            }, 100);
        }
    },

    getCouponNum: function (result) {
        var num;
        switch (result) {
            case "3":
                num = 8;
                break;
            case "5":
                num = 4;
                break;
            case "8":
                num = 6;
                break;
            case "10":
                num = 2;
                break;
            case "mk":
                num = 1;
                result = "MK女包1个";
                break;
            case "zl":
                num = 5;
                result = "首农黑八珍1盒";
                break;
            case "sn":
                num = 3;
                result = "山海工坊地道五色1盒";
                break;
            case "ws":
                num = 7;
                result = "首农五色益养1盒";
                break;

        }
        return {"num": num + 8, "result": result}/*+8多加一圈*/
    },

    dataProcess: function (data) {
        var _this = this, code = data.code, resultNum;
        if (code == 200 || code == 201) {
            if (code == 200) {
                resultNum = _this.getCouponNum(data.result.price)
            } else if (code == 201) {
                resultNum = _this.getCouponNum(data.type);
                _this.mobile = data.mobile;
            }
            _this.moveToDestination(resultNum);
        } else {
            if (code == -401) {
                window.location.href = result.url;
            } else if (code == -402) {
                $popArea.show();
                $popArea.find('.noCoupon').show().siblings().hide();
            } else if (code == -403) {
                $popArea.show();
                $popArea.find('.oneChance').show().siblings().hide();
            }
        }
    },

    checkPhone: function (val) {
        var reg = /^((13[0-9])|(14[0-9])|(15[0-9])|(17[37680])|(18[0-9]))\d{8}$/;
        if (reg.test(val)) {
            return true;
        } else {
            return false;
        }
    },
    /*失败成功提示*/
    sucOrFailHint(text){
        let $upImgHint = $('.upImgHint');
        $upImgHint.text(text).show();
        setTimeout(function(){
            $upImgHint.hide()
        },1500)
    }
};

/*
 * 中奖名单压缩上传图片
 * */
var CarouselAndHandleImg = {
    $carouselTitle: $('.carouselTitle'),
    $carouselWrap: $('.carouselWrap'),
    $upload : $('#upload'),
    $imgList : $('.imgList'),
    $usersNum : $('.usersNum'),
    filechooser: $('#choose'),
    timer: null,
    index: 0,
    showNum: 3,
    API:{
        renderAndUpImg:'/ajax/aj_springFestival003.php'
    },
    init () {
        //    用于压缩图片的canvas
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d');
        //    瓦片canvas
        this.tCanvas = document.createElement("canvas");
        this.tctx = this.tCanvas.getContext("2d");
        this.maxsize = 100 * 1024;//最大1M
        this.render();
        this.bind()
    },
    /*初始化*/
    render(){
        let _this = this,carouselStr = '';
        $.ajax({
            url: _this.API.renderAndUpImg,
            type: "GET",
            dataType: "json",
            data: {
                type:"init"
            }
        }).done(function(data){
            /*插入轮播数据*/
            let gift = data.gift,images = data.images,date;
            for(let i=0;i<gift.length;i++){
                carouselStr += '<li class="carouselItem" data-title="'+ gift.gift +'">'+ gift.tel +'</li>';
                _this.$carouselWrap.append(carouselStr);
            }
            let carouselItem = _this.$carouselWrap.find('.carouselItem');
            carouselItem.eq(1).addClass('active');
            _this.$carouselTitle.text( carouselItem.eq(1).attr('data-title'));
            /*轮播*/
            for (let i = 0; i < _this.showNum; i++) {
                $carouselItems.eq(i).clone(true).appendTo(_this.$carouselWrap);
            }
            _this.timer = setInterval(_this.animateUp.bind(_this), 2000);
            
            /*显示图片*/
            if(images){
                let len = images.length;
                for(let i=0 ;i<len;i++){
                    if(images[len-1].url != ""){
                        _this.$upload.find('.date').hide();
                        _this.$upload.find('.uploadImgBtn').text('签到成功').addClass('disable')
                    }else{
                        _this.$upload.find('.date').show();
                        _this.$upload.find('.uploadImgBtn').text('上传照片').removeClass('disable')
                    }
                    handleImgEle(data)
                }
            }
            /*参与人数*/
            _this.$usersNum.find('span').text(data.num)
        });
    },
    bind() {
        var _this = this,$popArea = $('.popArea'),$failPop = $popArea.find('.upFail ');
        /*
         * 副标题
         * */
        $('.subheading').on('click', function () {
            var upImgPartTop = $('.part4').offset().top;
            $('html,body').animate({scrollTop: upImgPartTop}, 500)
        });
        $('.upImgRuleBtn').on('click',function () {
            $popArea.show();
            $popArea.find('.upImgRule').show().siblings().hide();
            $('html,body').animate({scrollTop:0},500)
        });
        $('.uploadImgBtn').on('click', function () {
            if(!$(this).hasClass('disable')){
                _this.filechooser.click()
            }
        });
        _this.filechooser.on('change', function () {
            if (!this.files.length) return;//this.files  类数组
            var files = Array.prototype.slice.call(this.files);
            //只能上传一张图片
            if (files.length > 1) {
                $popArea.show();
                $failPop.find('.failText').text('只能上传一张图片哦~');
                $failPop.show().siblings().hide();
            } else {
                let file = files[0];
                if (!/\/(?:jpeg|png|gif)/i.test(file.type)){
                    $popArea.show();
                    $failPop.find('.failText').html('<p>图片上传失败</p><p>图片格式非JPG、PNG、GIF格式</p>');
                    $failPop.show().siblings().hide();
                    //符合jpeg|png|gif格式
                }else{
                    var reader = new FileReader();
                    reader.onload = function () {
                        var result = this.result;
                        var img = new Image();
                        img.src = result;
                        if (result.length <= _this.maxsize) {
                            //如果图片大小小于100kb，则直接上传
                            img = null;
                            _this.upload(result);//若此图是png，则该不住背景
                            return;
                        } else {
                            //图片加载完毕之后进行压缩，然后上传
                            if (img.complete) {
                                callback();
                            } else {
                                img.onload = callback;
                            }
                            function callback() {
                                var data = _this.compress(img);
                                _this.upload(data, file.type, $thisImgItem);
                                img = null;
                            }
                        }
                    };
                    reader.readAsDataURL(file);
                }

            }
        })
    },
    /*中奖名单轮播*/
    animateUp() {
        var _this = this,
            carouselItem = _this.$carouselWrap.find('.carouselItem'),
            carouselItemH = carouselItem.eq(0).outerHeight(true),
            carouselItemLen = carouselItem.length;
        _this.index++;
        if (_this.index >= carouselItemLen + 1) {
            _this.$carouselWrap.css('top', -carouselItemLen + 'px');
            _this.index = 1;
        }
        var activeItem = _this.$carouselWrap.find('.carouselItem').eq(_this.index + 1);
        activeItem.addClass('active').siblings().removeClass('active');
        _this.$carouselTitle.text(activeItem.attr('data-title'));
        _this.$carouselWrap.stop().animate({top: -_this.index * carouselItemH + 'px'});
    },
    handleImgEle(data){
        var _this = this;
        let $lastImg = $('#upload'),len = data.length,date,imgStr;
            for(let i=0;i<len;i++){
                date = _this.getDate(i);
                //显示图片
                if(i<6){
                    imgStr +=  '<li class="imgItem"><img src="'+data[i].url+'"> <div class="date">' + date + '</div> </li>';
                    _this.$imgList.append(imgStr);
                }else{
                    $lastImg.append('<img src="'+data[i].url +'"/>')
                }
            }
    },
    getDate(num){
        let date;
        switch (num) {
            case 0:
                date = '2017.1.27';
                break;
            case 1:
                date = '2017.1.28';
                break;
            case 2:
                date = '2017.1.29';
                break;
            case 3:
                date = '2017.1.30';
                break;
            case 4:
                date = '2017.1.31';
                break;
            case 5:
                date = '2017.2.1';
                break;
        }
        return date;
    },
    compress(img) {
        let initSize = img.src.length, width = img.width,height = img.height;
        //如果图片大于四百万像素，计算压缩比并将大小压至400万以下
        let ratio;
        if ((ratio = width * height / 4000000) > 1) {
            ratio = Math.sqrt(ratio);
            width /= ratio;
            height /= ratio;
        } else {
            ratio = 1;
        }
        this.canvas.width = width;
        this.canvas.height = height;
//        铺底色
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        //如果图片像素大于100万则使用瓦片绘制
        var count;
        if ((count = width * height / 1000000) > 1) {
            count = ~~(Math.sqrt(count) + 1); //计算要分成多少块瓦片
//            计算每块瓦片的宽和高
            var nw = ~~(width / count);
            var nh = ~~(height / count);
            this.tCanvas.width = nw;
            this.tCanvas.height = nh;
            for (var i = 0; i < count; i++) {
                for (var j = 0; j < count; j++) {
                    this.tctx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
                    this.ctx.drawImage(tCanvas, i * nw, j * nh, nw, nh);
                }
            }
        } else {
            this.ctx.drawImage(img, 0, 0, width, height);
        }
        //进行最小压缩
        var ndata = this.canvas.toDataURL('image/jpeg', 0.1);
        console.log('压缩前：' + initSize);
        console.log('压缩后：' + ndata.length);
        console.log('压缩率：' + ~~(100 * (initSize - ndata.length) / initSize) + "%");
        this.tCanvas.width = this.tCanvas.height = this.canvas.width = this.canvas.height = 0;
        return ndata;
    },
    upload(basestr) {
        let _this = this,$popArea = $('.popArea'),$failPop = $popArea.find('.upFail ');
        $.ajax({
            url: _this.API.renderAndUpImg,
            type: 'POST',
            dataType: 'json',
            data: {
                image: basestr
            }
        }).done(function (data) {
            let code = data.code;
            if(code == 200){
                _this.$upload.find('.date').hide();
                _this.$upload.find('.uploadImgBtn').text('签到成功').addClass('disable');
                _this.handleImgEle(data);
            }else{
                $popArea.show();
                $failPop.find('.failText').text('图片上传失败');
                $failPop.show().siblings().hide();
            }
        }).fail(function (jqXHR, textStatus) {
            console.log("Request failed: " + textStatus)
        })
    }
};
elevenGame._init();
CarouselAndHandleImg.init();




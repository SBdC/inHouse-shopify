$(document).ready(function () {

    //Currency Global Variables 

    let
        moneySpanSelector = 'span.money',
        currencyPickerSelector = '[name=currencies]',
        activeCurrencySelector = '.js-active-currency',
        currencyNoteSelector = '.js-cart-currency-note';

    let currencyPicker = {
        loadCurrency: function () {
            /* Fix for customer account pages */
            $(moneySpanSelector + ' ' + moneySpanSelector).each(function () {
                $(this).parents(moneySpanSelector).removeClass('money');
            });

            /* Saving the current price */
            $(moneySpanSelector).each(function () {
                $(this).attr('data-currency-' + shopCurrency, $(this).html());
            });

            // If there's no cookie.
            if (cookieCurrency == null) {
                if (shopCurrency !== defaultCurrency) {
                    Currency.convertAll(shopCurrency, defaultCurrency);
                }
                else {
                    Currency.currentCurrency = defaultCurrency;
                }
            }
            // If the cookie value does not correspond to any value in the currency dropdown.
            else if ($(currencyPickerSelector).length && $(currencyPickerSelector + 'option[value=' + cookieCurrency + ']').length === 0) {
                Currency.currentCurrency = shopCurrency;
                Currency.cookie.write(shopCurrency);
            }
            else if (cookieCurrency === shopCurrency) {
                Currency.currentCurrency = shopCurrency;
            }
            else {
                $(currencyPickerSelector).val(cookieCurrency);
                Currency.convertAll(shopCurrency, cookieCurrency);
            }


            currencyPicker.setCurrencyText();


        },
        onCurrencyChanged: function (event) {

            let
                newCurrency = $(this).val(),
                $otherpickers = $(currencyPickerSelector).not(this);


            Currency.convertAll(Currency.currentCurrency, newCurrency);
            currencyPicker.setCurrencyText(newCurrency);

            if ($otherpickers.length > 0) {
                $otherpickers.val(newCurrency);
            }

        },

        setCurrencyText: function (newCurrency = Currency.currentCurrency) {
            let
                $activeCurrency = $(activeCurrencySelector),
                $currencyNote = $(currencyNoteSelector);

            if ($activeCurrency.length > 0) {
                $activeCurrency.text(newCurrency);
            }

            if ($currencyNote.length > 0) {
                if (newCurrency !== shopCurrency) {
                    $currencyNote.show();
                }
                else {
                    $currencyNote.hide();
                }
            }

        },

        onMoneySpanAdded: function () {
            Currency.convertAll(shopCurrency, Currency.currentCurrency);
            currencyPicker.setCurrencyText();
        },

        init: function () {
            if (showMultipleCurrencies != true) {
                return false;
            }

            currencyPicker.loadCurrency();

            $(document).on('change', currencyPickerSelector, currencyPicker.onCurrencyChanged);
        }

    };

    currencyPicker.init();

    //Add to cart form

  
    let
        addToCartFormSelector = '#add-to-cart-form',
        productOptionSelector = addToCartFormSelector + ' [name*=option]';
        

    let productForm = {
        onProductOptionChanged: function (event) {
            let
                $form = $(this).closest(addToCartFormSelector),
                selectedVariant = productForm.getActiveVariant($form);
            $form.trigger('form:change', [selectedVariant]);
        },
        getActiveVariant: function ($form) {
            let
                variants = JSON.parse(decodeURIComponent($form.attr('data-variants')));
                formData = $form.serializeArray(); 
                formOptions = {
                    option1: null,
                    option2: null,
                    option3: null
                };
                selectedVariant = null;

                $.each(formData, function( index, item ){
                    if (item.name.indexOf('option') != -1) {
                        formOptions[item.name] = item.value; 
                    }
                });
                $.each(variants, function (index, variant ) {
                    if (variant.option1 === formOptions.option1 && variant.option2 === formOptions.option2 && variant.option3 === formOptions.option3  ) {
                        selectedVariant = variant;
                        return false;
                    }
                });

                return selectedVariant;
          
        },
        validate: function (event) {
            let 
             $form = $(this),
             hasVariant = selectedVariant !== null,
             canAddToCart = hasVariant && selectedVariant.inventory_quantity > 0,
             $id = $form.find('.js-variant-id'),
             $addToCartButton = $form.find('#add-to-cart-button'),
             $price = $form.find('.js-price'),
             formattedVariantPrice,
             priceHtml;

             if (hasVariant) {
                formattedVariantPrice = '$' + (selectedVariant.price/100).toFixed(2);
                priceHtml = '<span class="money">'+formattedVariantPrice+'</span>';
                window.history.replaceState(null, null, '?variant=' +selectedVariant.id);
             }
             else {
                 priceHtml = $price.attr(' ');
             }
          
             if (canAddToCart) {
                 $id.val(selectedVariant.id);
                 $addToCartButton.prop('disabled', false);
             }
             else{
                $id.val('');
                $addToCartButton.prop('disabled', true);
             }

             $price.html(priceHtml);
             currencyPicker.onMoneySpanAdded();
            
        },
        init: function () {
            $(document).on('change', productOptionSelector, productForm.onProductOptionChanged);
            $(document).on('form:change', addToCartFormSelector, productForm.validate);

        }
    };

    productForm.init();

    //ajax API Functuonality

    let ajaxify = {

        onAddToCart: function(event) {
            event.preventDefault();
            $.ajax({
                type: 'POST',
                url: '/cart/add.js',
                data: $(this).serialize(),
                dataType: 'json',
                success: ajaxify.onCartUpdated,
                error: ajaxify.onError
            });
        },
        onCartUpdated: function() {
            console.log('cart is updated');
            // alert('cart is updated');
            // $.ajax({
            //     type:'GET',
            //     url: '/cart',
            //     context: document.body,
            //     success: function(context){
            //       let
            //         $dataCartContents = $(context).find('.js-cart-page-contents'),
            //         dataCartHTML = $dataCartContents.html(),
            //         dataCartItemCount = $dataCartContents.attr('data-cart-item-count'),
            //         $miniCartContents = $('.js-mini-cart-contents'),
            //         $cartItemCount = $('.js-cart-item-count');
    
            //         $cartItemCount.text(dataCartItemCount);
            //         $miniCartContents.html(dataCartHTML);
    
            //     }
            // })
        },
          onError: function(XMLHttpRequest, textStatus) {
    
            let data = XMLHttpRequest.responseJSON;
            alert(data.status + '-' + data.message + ':' + data.description)
    
        },
        init: function () {
            $(document).on('submit', addToCartFormSelector, ajaxify.onAddToCart );
        }
    };
    ajaxify.init();


});


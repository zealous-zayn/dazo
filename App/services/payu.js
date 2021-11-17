const nanoid = require('nanoid');
const jsSHA = require('jssha'); 
const request = require('request')

let nanoId = nanoid.customAlphabet('0123456789ABCDEFGabcdefg', 8);

module.exports.paymentMethod =  (data) => {
    //Here save all the details in pay object
    return new Promise((resolve,reject)=>{
      const pay = {
        txnid : nanoId(),
        amount : parseFloat(data.amount),
        productinfo : "Dazo Live",
        firstname  : data.firstName,
        email : data.email,
        phone: parseInt(data.phone)
    };
    const hashString =
      "WjXg6s" + //store in in different file
      "|" +
      pay.txnid +
      "|" +
      pay.amount +
      "|" +
      pay.productinfo +
      "|" +
      pay.firstname +
      "|" +
      pay.email +
      "|" +
      "||||||||||" +
      "GkrD8713vSzKHzTDM7V9ZYxd7mWnKQx0"; //store in in different file
  
    const sha = new jsSHA("SHA-512", "TEXT");
    sha.update(hashString);
    //Getting hashed value from sha module
    const hash = sha.getHash("HEX");
  
    //We have to additionally pass merchant key to API
  
    pay.key = "WjXg6s"; //store in in different file;
    pay.surl = `${process.env.baseUrl}/payment/success?userId=${data.userId}&packageId=${data.packageId}`;
    pay.furl = `${process.env.baseUrl}/payment/fail`;
    pay.salt = 'GkrD8713vSzKHzTDM7V9ZYxd7mWnKQx0';
    pay.service_provider = 'payu_paise'
    pay.hash = hash;
    request.post({
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        url: 'https://secure.payu.in/_payment', //Testing url
        form: pay
        }, function (error, httpRes, body) {
       if (error) {
        reject(error)
       }
       if (httpRes.statusCode === 200) {
         resolve(body)
        } else if (httpRes.statusCode >= 300 && 
        httpRes.statusCode <= 400) {
        resolve(httpRes.headers.location.toString());
        }
        })
    })
  }
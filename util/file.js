const fs = require("fs");

const s3keys = require("../config/s3keys");

const aws = require('aws-sdk');

const s3 = new aws.S3({
  accessKeyId: s3keys.ID,
  secretAccessKey: s3keys.SECRET
});

const deleteFile = (bucket, key) => {
  let params = {
    Bucket: bucket,
    Key: key
  }
  s3.deleteObject(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
};

exports.deleteFile = deleteFile;

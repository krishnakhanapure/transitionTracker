var fs = require('fs'), http = require('http'), req = require('request'), express = require('express'), app = express();
var body = [];
var formidable = require("formidable");
var util = require('util');
var configJSON = [];
var bodyParser = require('body-parser')

var MongoClient = require('mongodb').MongoClient;

app.use(bodyParser.urlencoded({ extended: true })); 

app.get('/mainDashboard', function(req, res){

  getConfig(res);
  displayForm(res);

});

app.post('/:action', function(req, res){
	processAllFieldsOfTheForm(req, res);
});

function getConfig(res) {
      fs.readFile("config.json", function (err, data) {
        configJSON = data;
      });
}

function displayForm(res) {

    MongoClient.connect("mongodb://localhost:27017/interviewTracker", function(err, db1) {
          if(!err) {

            var totalFilled = 0, backFill = 0, totalOffered = 0, totalOpenPositions = 0, tableData = 0, tableData2 = 0, techClickData = 0, secLevelData = 0, totalPositionsOffered = 0;

            db1.collection('openPositionsTracker').aggregate({
                $group: {
                      _id: null,
                      totalValue : {
                          $sum: "$positionCheck"
                      }
                  }
              }, function(err, result) {
                if (err) return console.log(err)

                if(result.length == 0 || JSON.stringify(result) == '') {
                  console.log("inside []");
                  totalOpenPositions = 0;
                  
                }else {
                  console.log("inside 0");
                  totalOpenPositions = result[0].totalValue;
                }
                

                db1.close();
            });

            db1.collection('candidatesOfferedLetter').aggregate({
              $group: {
                _id : "$technology", 
                totalOffered:  { 
                    $sum : 1
                } 
              }
            }, function(err, countres) {
              if (err) return console.log(err)

                
                if(countres.length == 0) {
                  totalPositionsOffered = 0;
                }else {
                  
                  totalPositionsOffered = JSON.stringify(countres);
                }

                db1.close();
            });


            db1.collection('InterviewStatisticsData').aggregate({
                $group: {
                      _id: "$technologyStat",
                      testClear : {
                          $sum: "$testCount"
                      },
                      firstClear : {
                          $sum: "$techOneCount"
                      },
                      secondClear : {
                          $sum: "$techTwoCount"
                      },
                      HRClear : {
                          $sum: "$HRCount"
                      },
                      SHClear : {
                          $sum: "$stakeHolderCount"
                      },
                  }

                }, function(err, result) {
                  if (err) return console.log(err)

                    

                    if(result.length == 0) {
                       tableData2 = 0;
                      
                    }else {
                      tableData2 = JSON.stringify(result);
                    }
                    db1.close();
                });

            db1.collection('openPositionsTracker').aggregate({
                  $group: {
                      _id: "$technology",
                      positionCheckCount : {
                          $sum: "$positionCheck"
                      },
                      
                  }
                }, function(err, selresult) {
                  if (err) return console.log(err)

                    tableData = JSON.stringify(selresult);
                    db1.close();
                });

            db1.collection('openPositionsTracker').aggregate({
                  $group: {
                      "_id": {
                            "technology": "$technology",
                            "manager": "$NYMgr"
                        },
                      totalValue : {
                          $sum : "$positionCheck"
                      },
                  }
                     
                }, function(err, techAggrResult) {
                  if (err) return console.log(err)

                    if(techAggrResult == 0) {
                      techClickData = "";

                    }else {
                      techClickData = JSON.stringify(techAggrResult);
                    }
                    
                    db1.close();
                });

            db1.collection('openPositionsTracker').aggregate({
                  $group: {
                      "_id": {
                            "technology": "$technology",
                            "manager": "$NYMgr", 
                            "title": "$title",
                            "fullStack": "$fullStackCheck"
                        },

                      totalValue : {
                          $sum : "$positionCheck"
                      }
                  }
                     
                }, function(err, techAggrResult2) {
                  if (err) return console.log(err)
                    openTitlePositions = JSON.stringify(techAggrResult2);
                    db1.close();
                });

            db1.collection('VendorCandidateMap').count(function(error, total) {
                totalOffered = total;
                db1.close();
            });

            db1.collection('candidatesOfferedLetter').find().toArray(function (findErr, aum3) {
                secLevelData = JSON.stringify(aum3);
                db1.close();

            });

            db1.collection('candidatesOfferedLetter').count(function(error, totalYes) {

                fs.readFile('mainDashboard.html', function (err, data) {

                  totalFilled = totalYes;

                  var finalPageDisplay = "<script>var totalPositionsOffered = '"+totalPositionsOffered+"'; var openTitlePositions='"+openTitlePositions+"'; var secLevelData = '"+secLevelData+"'; var techClickData = '"+techClickData+"'; var tableData2 = '"+tableData2+"'; var tableData = '"+tableData+"'; var totalOpenPositions = '"+totalOpenPositions+"'; var totalCountDisplay = '"+totalFilled+"';</script>"+data;
                  res.write(finalPageDisplay);
                  res.end();
                });

                db1.close();
            });

          }else {
            console.log("We are not connected in display");
          }
          db1.close();
    });
}

function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm();
    var offerReleasedDetails = 0;

   form.parse(req, function (err, fields, files) {

        MongoClient.connect("mongodb://localhost:27017/interviewTracker", function(err, db) {
          if(!err) {
            console.log("We are connected");

            if(req.params.action == "fetchData") {

              db.collection('interviewTracker').find().toArray(function (findErr, aum) {
                db.close();
                var toDisplay = util.inspect(aum); 
                res.end(toDisplay);
                
              });

            }else if(req.params.action == 'fetchVendorMapPage') {
              var aumStr = [];

              db.collection('candidatesOfferedLetter').find().toArray(function (findErr, aum) {
                
                aumStr = aum;
                db.close();
            
              });

              db.collection('VendorCandidateMap').find().toArray(function (findErr, aum4) {
                
                mapReportList = JSON.stringify(aum4);
                db.close();
            
              });

              db.collection('VendorStaffList').find().toArray(function (findErr, aum2) {
                  db.close();
                  
                  fs.readFile('candidateVendorMap.html', function (err, data) {
                    
                    finalData = "<script>var managerConfig = '"+configJSON+"'; var mapReportList = '"+mapReportList+"'; var vendorJSONData = '"+JSON.stringify(aum2)+"'; var JSONData = '"+JSON.stringify(aumStr)+"'</script>"+data;
                    res.write(finalData);
                    res.end();
                  });

                });
            }

            else if(req.params.action == 'sendOPDetails') {
              console.log('into /sendOPDetails');

              fields.positionCheck = parseInt(fields.positionCheck);
              db.collection('openPositionsTracker').insert(fields, function(insError, insRecord){
                  if(insError) {
                    console.log("inside insError");
                  }else {
                    console.log("records added to DB");
                    //res.write('Added to DB');

                    fs.readFile('redirectAfterSave.html', function (err, data) {
                      
                      var datatoSend = "<script>var actionSent = 'getOpenPositions';</script>"+data;

                      res.write(datatoSend);
                      res.end();
                    });

                    db.close();
                  }
              });
            }

            else if(req.params.action == 'candidatesOfferReleased') {

              db.collection('candidatesOfferedLetter').insert(fields, function(insError, insRecord){
                  if(insError) {
                    console.log("inside insError");
                  }else {
                    fs.readFile('redirectAfterSave.html', function (err, data) {
                      
                      var datatoSend = "<script>var actionSent = 'getOfferScreen';</script>"+data;

                      res.write(datatoSend);
                      res.end();
                    });

                    db.close();
                  }
              });
            }

            else if(req.params.action == 'interviewStats') {
              console.log('into /interviewStats');

              fields.testCount = parseInt(fields.testCount);
              fields.techOneCount = parseInt(fields.techOneCount);
              fields.techTwoCount = parseInt(fields.techTwoCount);
              fields.HRCount = parseInt(fields.HRCount);
              fields.offerCount = parseInt(fields.offerCount);
              fields.stakeHolderCount = parseInt(fields.stakeHolderCount);

              db.collection('InterviewStatisticsData').insert(fields, function(insError, insRecord){
                  if(insError) {
                    console.log("inside insError");
                  }else {

                    fs.readFile('redirectAfterSave.html', function (err, data) {
                      
                      var datatoSend = "<script>var actionSent = 'getOfferScreen';</script>"+data;

                      res.write(datatoSend);
                      res.end();
                    });
                    
                    db.close();
                  }
              });
            }

            else if(req.params.action == 'addVendorDetails') {
              console.log('into /addVendorDetails');

              db.collection('VendorStaffList').insert(fields, function(insError, insRecord){
                  if(insError) {
                    console.log("inside insError");
                  }else {

                    fs.readFile('redirectAfterSave.html', function (err, data) {
                      
                      var datatoSend = "<script>var actionSent = 'uploadVendor';</script>"+data;

                      res.write(datatoSend);
                      res.end();
                    });

                    db.close();

                  }
              });

            } else if(req.params.action == 'mapVendorCanDetails') {
              console.log('into /mapVendorCanDetails');

              db.collection('VendorCandidateMap').insert(fields, function(insError, insRecord) {
                  if(insError) {
                    console.log("inside insError");
                  }else {

                    fs.readFile('redirectAfterSave.html', function (err, data) {
                      
                      var datatoSend = "<script>var actionSent = 'fetchVendorMapPage';</script>"+data;

                      res.write(datatoSend);
                      res.end();
                    });

                    db.close();

                  }
              });
            }

            else if(req.params.action == 'getOpenPositions') {

              db.collection('openPositionsTracker').find().toArray(function (findErr, data4) {
                var openPositionsJSON = JSON.stringify(data4);

                fs.readFile('getDetails.html', function (err, data) {
                  
                  var datatoSend = "<script>var configJSON = '"+configJSON+"'; var openPositionsJSON = '"+openPositionsJSON+"'</script>"+data;

                  res.write(datatoSend);
                  res.end();
                });
                db.close();

              });

            }
            else if(req.params.action == 'getOfferScreen') {
              var techTitleArrJSON = 0, interviewStatJSON = 0;
              
              db.collection('openPositionsTracker').aggregate({
                  $group : {
                        _id : "$technology", 
                        title : {$addToSet : "$title"}
                        
                    }
                     
                }, function(err, techTitleArr) {
                  if (err) return console.log(err)
                    techTitleArrJSON = JSON.stringify(techTitleArr);
                    db.close();
                });

              db.collection('InterviewStatisticsData').find().toArray(function (findErr, data3) {
                interviewStatJSON = JSON.stringify(data3);
                db.close();

              });

              db.collection('candidatesOfferedLetter').find().toArray(function (findErr, data2) {
                var offerReleasedDetails = JSON.stringify(data2);

                fs.readFile('offerScreen.html', function (err, data) {
                  
                  var newPage = "<script>var interviewStatJSON =  '"+interviewStatJSON+"'; var techTitleArrJSON = '"+techTitleArrJSON+"'; var offerReleasedDetails = '"+offerReleasedDetails+"'</script>"+data;
                  res.write(newPage);
                  res.end();
                });

                db.close();

              });
            }
            else if(req.params.action == 'uploadVendor') {
              var aumStr = [];
              var aum2Str = [];

              db.collection('candidatesOfferedLetter').find().toArray(function (findErr, aum) {
                
                aumStr = aum;
                db.close();
            
              });

              db.collection('VendorCandidateMap').find().toArray(function (findErr, aum4) {
                
                mapReportList = JSON.stringify(aum4);
                db.close();
            
              });

              db.collection('VendorStaffList').find().toArray(function (findErr, aum2) {
                  aum2Str = JSON.stringify(aum2);
                  db.close();
                  
                });

              db.collection('VendorStaffList').find().toArray(function (findErr, venStaffData) {
                venStaffDataJSON = JSON.stringify(venStaffData);

                fs.readFile('uploadVendor.html', function (err, data) {

                  var dataToSend = "<script>var JSONData = '"+JSON.stringify(aumStr)+"'; var vendorJSONData = '"+aum2Str+"'; var managerConfig = '"+configJSON+"'; var mapReportList = '"+mapReportList+"'; var configJSON = '"+configJSON+"'; var venStaffDataJSON = '"+venStaffDataJSON+"';</script>"+data;
                  res.write(dataToSend);

                  res.end();
                });

                db.close();

              });

            }

            else if(req.params.action == 'displaydashboard') {

                displayForm(res);

            }

            else {
              db.collection('interviewTracker').insert(fields, function(insError, insRecord){
                if(insError) {
                  console.log("inside insError");
                }else {
                  console.log("records added to DB");
                  db.close();
                  res.end('<html><body><form method="post" action="fetchData"><button type="submit" id="fetchData">Fetch Data</button></form></body></html>');
                }
              });
              
            }

          }else {
            console.log("We are not connected");

          }
        
          db.close();
        });

    });
}

app.listen(3000);
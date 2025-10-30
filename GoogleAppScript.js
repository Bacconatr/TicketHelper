function onFormSubmit(e) {
  var formResponses = e.values;
  
  var discordId = formResponses[10];
  
  var webhookUrl = 'http://pebblehost_ip:port/verify';
  
  var payload = {
    'discord_id': discordId
  };
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };
  
  try {
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }
}
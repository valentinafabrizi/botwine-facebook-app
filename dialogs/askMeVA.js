var builder = require('botbuilder');
var environment = require('../UTILS/env').createLibrary;

var lib = new builder.Library('askme');

const CONTROL_STRING = "-ASK-";

var replaceAll = function(str, searchStr, replaceStr) {
	// var str = this;

    // no match exists in string?
    if(str.indexOf(searchStr) === -1) {
        // return string
        return str;
    }

    // replace and remove first match, and do another recursirve search/replace
	str = str.replace(searchStr, replaceStr);
	str = replaceAll(str, searchStr, replaceStr);
    return str;
}

lib.dialog('VA',[
	//Questa è la funzione che invoca il VA
	function (session, args) {
		messageSent = session.message;

		var MAX_SIZE_BUTTON_LIST = -1;
		var CURRENT_CHANNEL = environment().CHANNEL(session);
		var REST_CLIENT = environment().REST_CLIENT;		
		const CHANNELS_ID = environment().CHANNELS_ID;

		switch(CURRENT_CHANNEL){
			case CHANNELS_ID.FACEBOOK: MAX_SIZE_BUTTON_LIST = 3; break;
			case CHANNELS_ID.SKYPE: MAX_SIZE_BUTTON_LIST = 3; break;
			default: MAX_SIZE_BUTTON_LIST = 0;
		}

		var args = {
    		data: {
    			"projectId" : process.env.ID_PROJECT, //ID del progetto VA salvato come variabile di ambiente in HEROKU
    			"channel" : "MSSNGR",
				//"question" : messageSent.text,
				"correlationId": session.userData.correlationId
	    	},
    		headers: { "Content-Type": "application/json" }
		};

		var baseUrl = process.env.BASE_URL;//Base del servizio salvata come variabile di ambiente in HEROKU
		var url = null;

		if(messageSent["text"].endsWith(CONTROL_STRING)){
			url = baseUrl + process.env.ACTION_CATEGORY;
			args.data.category = messageSent["text"].replace(CONTROL_STRING,"");
		}else{
			url = baseUrl + process.env.ACTION_ANSWER;
			args.data.question = messageSent.text;
		}

		var req =  REST_CLIENT.post(url, args, function (data, response) {
			
			console.log("URL =================> ", url);
			
	    	chatMessage = data.answer;

			//Recupero htmlAnswerStructure e il suo contenuto htmlObj
			buttonsList = [];
			try {
				if("htmlAnswerStructure" in data){
					htmlAS = data.htmlAnswerStructure;
					if("htmlObj" in htmlAS){
						buttonsList = htmlAS.htmlObj;
					}
					if("htmlStructureBefore" in htmlAS){
						chatMessage = htmlAS.htmlStructureBefore;
					}
				}
			} catch (error) {
				//				
			}
	
			if(!chatMessage) chatMessage = "Non ho capito bene....";
			chatMessage = chatMessage.replace("<div><!--block-->","").replace("<!--block--></div>","").replace("</div>","");
			chatMessage = replaceAll(chatMessage,"<br>","\n");

			if(CHANNELS_ID.WEB === CURRENT_CHANNEL) chatMessage = chatMessage.replace("<br>","\n"); 

			/*
				A questo punto la risposta potrebbe essere semplice testo, 
				o contenere pulsanti.
			*/
			if(buttonsList.length==0){
				//Si tratta di semplice testo
				session.send(chatMessage);
			}else{
				var cardList = [];

			    var buttonsCard = new builder.HeroCard(session).text("Scegli...").buttons([]);	
				if (CURRENT_CHANNEL === CHANNELS_ID.SKYPE) {
					buttonsCard.text(chatMessage + " Scegli...");
				}

				myButtons = [];
				for (var item in buttonsList) {
				   if(item>0 && item%MAX_SIZE_BUTTON_LIST==0){
						buttonsCard.data.content.buttons = myButtons;
						cardList.push(buttonsCard);

						buttonsCard = new builder.HeroCard(session).buttons([]);	
						buttonsCard.text("...oppure..."); 
						myButtons = [];
				   };
				   currentButtonDescr = buttonsList[item];
				   myButtons.push(
					   {
						"type": "postBack",
						"value": currentButtonDescr.categoryId + CONTROL_STRING,
						"title": currentButtonDescr.objLabel
					}
				   );
				}
				if(myButtons.length>0){
					buttonsCard.data.content.buttons = myButtons;
					if(MAX_SIZE_BUTTON_LIST!=0 && buttonsList.length>MAX_SIZE_BUTTON_LIST) buttonsCard.text("...infine!"); 
					cardList.push(buttonsCard);
				}

				var msg = new builder.Message(session)
									.text(chatMessage)
									.attachmentLayout(builder.AttachmentLayout.carousel)
									.attachments(cardList);

				session.send(msg)
			}			
	
		});

		req.on('error', function (err) {
   			console.log('request error', err);
			session.send("Ora sono un poco occupato, tra qualche minuto torno da te!");
		});
	}
]);

module.exports.createLibrary = function () {
    return lib.clone();
};

var builder = require('botbuilder');

const library = new builder.Library('welcome');

    const MainOptions = {
        a: 'Vorrei informazioni sull\'assicurazione auto',
        b: 'Come posso tutelare la mia Impresa?',
        c: 'Ci sono soluzioni anche per la nautica?',
    };

    library.dialog('/', [
        function (session) {
                var welcomeCard = new builder.ThumbnailCard(session)
                            .text("Fammi una domanda e io ti aiutero' a trovare le informazioni di cui hai bisogno. Scrivi in un linguaggio semplice e naturale, ad esempio: 'Che vino posso abbinare a..' oppure 'Stasera vorrei preparare un piatto a base di...'")
                            .title('Benvenuto in BOTWINE!')
                            .subtitle('Sono il tuo Sommelier');
//                            .buttons([
//                                builder.CardAction.imBack(session, MainOptions.a, MainOptions.a),
//                                builder.CardAction.imBack(session, MainOptions.b, MainOptions.b),
//                                builder.CardAction.imBack(session, MainOptions.c, MainOptions.c)
//                                    ]);	        
                session.send(new builder.Message(session)
                            .addAttachment(welcomeCard));
                session.endDialog();
            
        }
    ]);

module.exports = library;
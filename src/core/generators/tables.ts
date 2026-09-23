/**
 * Tabelle dei generatori — **contenuto originale scritto per JumpMaster** (ADR-0011).
 *
 * Nessuna di queste liste viene da un manuale. Per arricchire un generatore basta aggiungere voci
 * qui: il codice non cambia. ⚠ Modulo puro (invariante I1).
 */

/* ── PNG ──────────────────────────────────────────────────────────── */

export const OCCUPATIONS = [
  'fabbro', 'oste', 'guardia cittadina', 'pescatore', 'mercante di stoffe', 'erborista', 'becchino',
  'scriba', 'cacciatore', 'mugnaio', 'sacerdotessa di campagna', 'contrabbandiere', 'cartografo',
  'menestrello', 'guaritrice', 'ladro in pensione', 'traghettatore', 'fornaio', 'cavaliere decaduto',
  'mendicante', 'alchimista', 'boscaiolo', 'esattore delle tasse', 'domatore di cavalli', 'bibliotecaria',
  'minatore', 'mercenario', 'pellegrino', 'vedova del borgomastro', 'apprendista mago',
] as const;

export const APPEARANCES = [
  'una cicatrice che gli attraversa il sopracciglio', 'mani sempre sporche di inchiostro', 'un mantello troppo elegante per la sua condizione',
  'un dente d’oro che mostra quando sorride', 'capelli bianchi nonostante la giovane età', 'un occhio di vetro di colore diverso',
  'vestiti rattoppati con cura', 'un profumo di spezie che lo precede', 'un tatuaggio di serpente sul polso',
  'una voce roca da fumatore di pipa', 'un anello troppo grande che continua a girare', 'stivali infangati fino al ginocchio',
  'una benda sulla mano sinistra', 'un portamento militare', 'orecchini di conchiglia', 'occhiaie profonde di chi non dorme',
  'una piuma di corvo appuntata al cappello', 'lentiggini e un sorriso contagioso', 'un bastone intagliato a forma di serpente',
  'la pelle bruciata dal sole dei viaggi',
] as const;

export const MANNERS = [
  'parla sottovoce, come se qualcuno ascoltasse', 'ride troppo forte delle proprie battute', 'non guarda mai negli occhi',
  'ripete l’ultima parola di chi gli parla', 'offre da bere a tutti, poi chiede un favore', 'conta le monete due volte',
  'cita proverbi che nessuno ha mai sentito', 'si tocca la tasca quando è nervoso', 'interrompe per correggere i dettagli',
  'è gentile in modo quasi sospetto', 'risponde alle domande con altre domande', 'si scusa di continuo',
  'fischietta sempre la stessa canzone', 'tratta tutti come vecchi amici', 'parla di sé in terza persona',
  'annusa l’aria prima di rispondere', 'ha fretta, sempre', 'giura sugli dei per qualsiasi cosa',
] as const;

export const WANTS = [
  'saldare un debito prima che lo trovino', 'ritrovare un fratello partito anni fa', 'essere ammesso nella gilda',
  'vendicare un torto che nessuno ricorda', 'lasciare il villaggio senza che la famiglia lo sappia', 'proteggere un segreto di famiglia',
  'guadagnare abbastanza da comprare una locanda', 'scoprire chi gli ha rubato la mappa', 'farsi perdonare da qualcuno',
  'diventare famoso, a qualunque costo', 'riavere la terra che gli hanno tolto', 'trovare un rimedio per la figlia malata',
  'sposarsi entro la fine del raccolto', 'far chiudere la miniera', 'dimostrare di non essere un codardo',
  'tornare a casa, ovunque sia ormai', 'rubare al ricco mercante che l’ha umiliato', 'essere lasciato in pace',
] as const;

export const SECRETS = [
  'è ricercato in un’altra città sotto un altro nome', 'ha visto il delitto, ma ha paura a parlare',
  'lavora per il nemico dei personaggi', 'è l’erede legittimo di una casata caduta', 'deve la vita a un mostro',
  'ha nascosto un cadavere nella cantina', 'è segretamente devoto a un dio proibito', 'ha falsificato il testamento del padre',
  'conosce l’ingresso nascosto delle rovine', 'è una spia al servizio della corona', 'ha venduto l’anima per salvare qualcuno',
  'non è chi dice di essere: il vero è morto', 'custodisce un oggetto maledetto che non riesce a buttare',
  'ha tradito i vecchi compagni d’avventura', 'sente una voce che gli parla nei sogni', 'è innamorato della persona sbagliata',
] as const;

export const VOICES = [
  'accento del sud, strascicato', 'voce acuta e veloce', 'basso e lento, pesa ogni parola', 'rauco, con una tosse ogni tanto',
  'cantilenante, quasi recitato', 'secco e militare', 'caldo e rassicurante', 'nasale e lamentoso', 'sussurrato',
  'teatrale, con grandi gesti', 'balbetta quando mente', 'formale, antiquato',
] as const;

/* ── Taverne ──────────────────────────────────────────────────────── */

export const TAVERN_NOUNS = [
  { word: 'Drago', gender: 'm' }, { word: 'Luna', gender: 'f' }, { word: 'Cinghiale', gender: 'm' }, { word: 'Lanterna', gender: 'f' },
  { word: 'Corvo', gender: 'm' }, { word: 'Botte', gender: 'f' }, { word: 'Grifone', gender: 'm' }, { word: 'Sirena', gender: 'f' },
  { word: 'Boccale', gender: 'm' }, { word: 'Volpe', gender: 'f' }, { word: 'Menestrello', gender: 'm' }, { word: 'Spada', gender: 'f' },
  { word: 'Caprone', gender: 'm' }, { word: 'Stella', gender: 'f' }, { word: 'Orso', gender: 'm' }, { word: 'Rosa', gender: 'f' },
  { word: 'Scoiattolo', gender: 'm' }, { word: 'Aquila', gender: 'f' }, { word: 'Unicorno', gender: 'm' }, { word: 'Zucca', gender: 'f' },
] as const;

export const TAVERN_ADJECTIVES = [
  { m: 'Ubriaco', f: 'Ubriaca' }, { m: 'Zoppo', f: 'Zoppa' }, { m: 'Dorato', f: 'Dorata' }, { m: 'Addormentato', f: 'Addormentata' },
  { m: 'Ridente', f: 'Ridente' }, { m: 'Nero', f: 'Nera' }, { m: 'Fortunato', f: 'Fortunata' }, { m: 'Affamato', f: 'Affamata' },
  { m: 'Rosso', f: 'Rossa' }, { m: 'Cantante', f: 'Cantante' }, { m: 'Storto', f: 'Storta' }, { m: 'd’Argento', f: 'd’Argento' },
] as const;

export const TAVERN_ATMOSPHERES = [
  'fumosa e chiassosa, con una rissa che sta per scoppiare', 'quasi vuota: solo un vecchio che gioca a dadi da solo',
  'affollata di mercanti che parlano di prezzi e briganti', 'silenziosa in modo innaturale quando entrate',
  'un menestrello stonato canta di un eroe mai esistito', 'calda, profuma di pane e di cera',
  'le finestre sono sbarrate e tutti tengono le armi a portata', 'piena di contadini che festeggiano il raccolto',
  'un gruppo di soldati occupa il tavolo migliore e non intende cederlo', 'il pavimento scricchiola e il tetto gocciola',
] as const;

export const DISHES = [
  'stufato di coniglio e castagne', 'zuppa di cipolle con crosta di formaggio', 'pesce di fiume alla brace',
  'polenta con funghi e salsiccia', 'pane nero, lardo e mele', 'arrosto di cinghiale (duro come un’ascia)',
  'torta salata di porri', 'minestra di fagioli che nessuno sa da quanto bolle', 'uova sode e aringhe affumicate',
  'pasticcio di carne di dubbia provenienza', 'formaggio di capra con miele', 'focaccia alle erbe e zuppa di zucca',
] as const;

export const DRINKS = [
  'birra scura del monastero', 'sidro aspro di mele selvatiche', 'vino rosso annacquato', 'idromele al miele di castagno',
  'grappa che brucia la gola', 'birra chiara e tiepida', 'vino caldo speziato', 'liquore d’erbe dell’oste (non chiedete cosa c’è dentro)',
] as const;

/* ── Voci di paese ────────────────────────────────────────────────── */

/**
 * Chi è protagonista della voce, con **genere e numero**: servono a concordare participi e verbi
 * («sia stato visto» / «sia stata vista» / «siano stati visti»).
 */
export const RUMOR_WHO = [
  { text: 'il figlio del fabbro', form: 'ms' }, { text: 'una donna vestita di grigio', form: 'fs' },
  { text: 'un cavaliere senza stemma', form: 'ms' }, { text: 'il vecchio pastore', form: 'ms' },
  { text: 'due forestieri con accento del nord', form: 'mp' }, { text: 'la guaritrice del villaggio', form: 'fs' },
  { text: 'un bambino che nessuno conosce', form: 'ms' }, { text: 'il prete', form: 'ms' },
  { text: 'la moglie del mugnaio', form: 'fs' }, { text: 'un mercante di reliquie', form: 'ms' },
  { text: 'un lupo grande come un vitello', form: 'ms' }, { text: 'tre sorelle che vivono nel bosco', form: 'fp' },
] as const;

export const RUMOR_WHERE = [
  'vicino al vecchio pozzo', 'sulla strada del bosco', 'davanti alla cripta', 'al guado del fiume', 'sulle rovine della torre',
  'nel cimitero dietro la chiesa', 'al crocevia delle tre querce', 'sulla collina dove non cresce l’erba', 'nella miniera abbandonata',
] as const;

export const RUMOR_WHEN = [
  'a mezzanotte', 'la notte di luna piena', 'tre giorni fa', 'all’alba prima del canto dei galli', 'durante l’ultima tempesta',
  'la sera della fiera', 'ogni notte da una settimana',
] as const;

export const RUMOR_DETAILS = [
  'con le mani sporche di terra', 'mentre parlava da solo', 'con una lanterna dalla luce verde', 'trascinando un sacco pesante',
  'seguito da tre corvi', 'cantando una ninna nanna', 'senza lasciare impronte nel fango', 'con il volto coperto',
] as const;

export const RUMOR_TREASURES = [
  'una spada che non arrugginisce', 'le monete di un re dimenticato', 'un libro che nessuno riesce a finire di leggere',
  'una campana d’argento', 'le ossa di un santo', 'una mappa tatuata su una pelle', 'uno scrigno che si apre solo col sangue',
] as const;

export const RUMOR_EVENTS = [
  'il borgomastro è sparito', 'il pozzo ha iniziato a dare acqua salata', 'i cani ululano tutti insieme',
  'la chiesa ha chiuso le porte', 'i mercanti hanno smesso di passare', 'le campane suonano da sole',
] as const;

/* ── Spunti narrativi ─────────────────────────────────────────────── */

export const HOOK_WHO = [
  'Un’anziana contadina', 'Il borgomastro, di nascosto dal consiglio,', 'Un giovane cavaliere al primo incarico', 'Una sacerdotessa ferita',
  'Un mercante in rovina', 'Il capo delle guardie', 'Un bambino con una moneta d’oro in mano', 'Un nano che ha perso il suo clan',
  'Una nobile in incognito', 'Un fantasma che solo uno di voi vede', 'Il rivale di uno dei personaggi', 'Un mago che parla troppo in fretta',
] as const;

/**
 * Cosa chiedono, **ognuno con le sue complicazioni**: una complicazione deve riguardare
 * l'incarico. «Indagare su una morte» seguito da «la persona scomparsa non vuole essere trovata»
 * non ha senso, e un DM se ne accorgerebbe al primo sguardo.
 */
export const HOOK_WHAT = [
  { text: 'ritrovare una persona scomparsa', twists: ['la persona scomparsa non vuole essere trovata', 'chi è scomparso ha cambiato faccia e nome'] },
  { text: 'scortare un carico fino alla città vicina', twists: ['il carico è vivo', 'il carico è stato sostituito prima della partenza'] },
  { text: 'recuperare un oggetto rubato', twists: ['l’oggetto è maledetto e chi lo tocca cambia', 'il ladro l’ha rubato per salvare qualcuno'] },
  { text: 'indagare su una morte sospetta', twists: ['la vittima è ancora viva', 'è stato un incidente, ma qualcuno vuole a tutti i costi un colpevole'] },
  { text: 'liberare la miniera da ciò che la abita', twists: ['il mostro protegge qualcosa di peggio', 'i minatori hanno scavato dove non dovevano'] },
  { text: 'consegnare una lettera senza aprirla', twists: ['la lettera è una condanna a morte per chi la riceve', 'il destinatario è morto da anni'] },
  { text: 'proteggere il villaggio per tre notti', twists: ['il pericolo viene da dentro il villaggio', 'gli abitanti nascondono cosa li minaccia davvero'] },
  { text: 'trovare l’ingresso di una tomba perduta', twists: ['la tomba è vuota da secoli', 'l’ingresso si apre solo dall’interno'] },
  { text: 'smascherare un traditore', twists: ['il traditore ha delle buone ragioni', 'le prove indicano uno dei personaggi'] },
  { text: 'riportare indietro una reliquia', twists: ['la reliquia è un falso', 'la reliquia non vuole tornare'] },
  { text: 'trattare con i banditi della foresta', twists: ['i banditi hanno ragione', 'il capo dei banditi è un parente del committente'] },
  { text: 'scoprire perché il raccolto marcisce', twists: ['la terra è stata avvelenata apposta', 'il raccolto marcisce solo dove dorme qualcuno'] },
] as const;

export const HOOK_WHY = [
  'nessun altro ha il coraggio di farlo', 'la ricompensa è l’intera eredità di famiglia', 'una profezia parla di voi',
  'ha un debito con uno dei personaggi', 'il tempo stringe: alla prossima luna sarà tardi', 'le autorità sono corrotte',
  'ha già perso tutti gli altri che ha mandato', 'crede che solo degli stranieri possano riuscirci',
] as const;

/** Complicazioni che funzionano con qualunque incarico. */
export const HOOK_GENERIC_TWISTS = [
  'chi vi ha assunto è il vero colpevole', 'la ricompensa è falsa', 'qualcun altro è sulla stessa pista, e ha un vantaggio',
  'uno dei personaggi è già coinvolto, senza saperlo', 'le autorità vi seguono', 'il committente morirà prima che torniate',
] as const;

/* ── Botteghe ─────────────────────────────────────────────────────── */

/** Tipo di bottega → categorie dell'equipaggiamento SRD che vende. */
export const SHOP_KINDS = [
  { kind: 'Armaiolo', categories: ['Weapon', 'Armor'], keeper: 'fabbro' },
  { kind: 'Emporio', categories: ['Adventuring Gear'], keeper: 'mercante' },
  { kind: 'Bottega d’artigiano', categories: ['Tools'], keeper: 'artigiano' },
  { kind: 'Stalla e rimessa', categories: ['Mounts and Vehicles'], keeper: 'domatore di cavalli' },
] as const;

export const SHOP_QUIRKS = [
  'fa lo sconto a chi racconta una storia che non ha mai sentito', 'non vende nulla a chi porta armi sguainate',
  'tiene un gatto che sceglie i clienti', 'accetta baratti al posto delle monete', 'chiude ogni volta che passa un funerale',
  'ha un retrobottega dove non fa entrare nessuno', 'litiga coi fornitori davanti ai clienti', 'regala una caramella a ogni acquisto',
  'è convinto che un cliente su tre sia un ladro', 'vende anche informazioni, a prezzo da concordare',
] as const;

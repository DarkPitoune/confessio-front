# Before V0
- faire du server side rendering pour la page /church et la page /diocese
  - il est possible que ce soit beaucoup plus simple de switch de tanstasck query a (SWR)[https://swr.vercel.app/docs/getting-started] pour ca
- le bouton back en navigation ne trigger pas de re-render, ou peut etre que ca marche en fait
- eventuellement changer la couleur de la tooltip selectionnée


## Server side rendering: the big bad plan
le pb c'est que la page church doit etre accedee de 2 facons differentes. soit en naviguant depuis la page / soit depuis le lien direct. 

# V1 nice cleanups
- optimisation : fetch dans un rectangle 10% plus grand pour anticiper les micros-deplacements
- different look for the church tile when a date filter is applied? no need to specify date..
- le site n'est pas du tout TAB-able, on doit focus le tab dans la modale
- revoir la bottom modal sur mobile, le SwipeableDrawer de MUI semble très prometteur, mais pas concu pour...


# Discussion topics
- parler de query cancellation. est ce une bonne alternative à du debouncing?

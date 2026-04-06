# Before V0
- faire du server side rendering pour la page /diocese
- utiliser un pack d'icone genre phosphore icons

# V1 nice cleanups
- different look for the church tile when a date filter is applied? no need to specify date..
- le site n'est pas du tout TAB-able, on doit focus le tab dans la modale
- revoir la bottom modal sur mobile, le SwipeableDrawer de MUI semble très prometteur, mais pas concu pour...
- fix: clicking a church pin causes the modal sheet to animate up from bottom instead of appearing in place (remount issue)


# Discussion topics
- parler de query cancellation. est ce une bonne alternative à du debouncing?



# etienne
menu boutons, on devrait rajouter hozanna. ou alors comme un footer tout en bas de la liste des eglises, logo a retrouver dans le github de confessio.fr

endpoint seo pour / -> rien, pareil pour diocese. par defaut sans js on pourrait mettre paris? ou revoir les ip geoloc? ou dezoom sur la france

avoir sur / une liste de tous les dioceses, qui permet aux robots de parse le reste du site
lien vers le reste des donnees... voir mieux pour voir la source? 
actiopn pour commenter -> il va ouvrir un /report, ouvrir une textarea
retirer le filtre implicite du "on retire les trucs qui sont passes/ont deja commence"
onclick sur une eglise qui a pas d'event
ajouter home_url a la place du premier lien vers confessio.fr

hozana, order des returns dans la liste, tracking, 


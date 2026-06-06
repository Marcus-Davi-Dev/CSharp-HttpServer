function el(query, context=document){
    return context.querySelector(query);
}

const players = el("ol#players");
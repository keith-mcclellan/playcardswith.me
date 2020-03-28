import { Room, Client } from "colyseus";
import { State, initialState, LocatedCard, Card, Deck, Player, Vector } from "cards-library";

export class MyRoom extends Room {
    state: State;

    constructor () {
        super();
        this.state = initialState();
    }

    onCreate (options: any) {
        this.setState(this.state);
    }

    onJoin (client: Client, options: any) {
        console.log(`${client.id} joined`);

        let hand: Card[] = [];
        let pointer : Vector = new Vector(0, 0);
        let player = new Player(client.id, hand, pointer, client.id);

        this.state.addPlayer(player);
    }

    onMessage (client: Client, message: any) {
        console.log("Message:", message);
        if (message.messageType == "card_move") {
            let locatedCard
                = this.state.table.getLocatedCard(message.cardId);
            if (!locatedCard) {
                for (let i = 0;
                     i < this.state.decks.length; i++) {
                    let deck = this.state.decks[i];
                    if (deck.peakTop().id == message.cardId) {
                        let card = deck.takeTopCard()!;
                        let newZIndex = this.state.table.getHighestZIndex() + 1;
                        this.state.table.locatedCards.push(
                            new LocatedCard(card, new Vector(
                                message.cardX, message.cardY), newZIndex));
                        return;
                    }
                }

                console.log("Invalid card id:", message.cardId);
                return;
            }
            locatedCard.location.x = message.cardX;
            locatedCard.location.y = message.cardY;

            this.state.table.bringCardToFront(locatedCard);
        } else if (message.messageType == "card_turn") {
            let locatedCard = this.state.table.getLocatedCard(message.cardId);
            if (!locatedCard) {
                console.log("Invalid card id:", message.cardId);
                return;
            }
            let card = locatedCard.card;
            card.open = !card.open;

            this.state.table.bringCardToFront(locatedCard);
        } else if (message.messageType == "pointer_move") {
            let player = this.state.getPlayer(message.playerId);

            if (player !== null) {
                player.pointer.x = message.pointerX;
                player.pointer.y = message.pointerY;
            }
        }
    }

    onLeave (client: Client, consented: boolean) {
        console.log(client.id + "left");
        this.state.removePlayer(client.id);
    }

    onDispose() {
    }

}

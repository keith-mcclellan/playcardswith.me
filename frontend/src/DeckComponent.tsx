import React from "react";
import {Deck, Card, Player, getLocObject} from "cards-library";
import "./DeckComponent.css";
import {DropdownButton, Dropdown, Modal, Form, Button} from "react-bootstrap";
import {DraggableCore, DraggableData} from 'react-draggable';
import CardDragReleaseHandler, {CardLocation} from "./CardDragReleaseHandler";

type Props = {
    deck: Deck,
    sendMessage: (msg: any) => void,
    deckRef: any,
    players: Player[],
    cardDragReleaseHandler: CardDragReleaseHandler,
}
type State = {
    draggingCard: Card | null,
    showDealModal: boolean,
    amountPerPlayer: number,
    reShuffleDeck: boolean,
}

export default class DeckComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            draggingCard: null,
            showDealModal: false,
            amountPerPlayer: 7,
            reShuffleDeck: true,
        };
    }

    private recallToThisDeck() {
        this.props.sendMessage({
            messageType: "recall_to_deck",
            deckId: this.props.deck.id,
        });
    }

    private shuffleThisDeck() {
        this.props.sendMessage({
            messageType: "shuffle_deck",
            deckId: this.props.deck.id,
        });
    }

    private removeThisDeck() {
        this.props.sendMessage({
            messageType: "remove_deck",
            deckId: this.props.deck.id,
        });
    }

    private getMaxDeal() {
        return Math.floor(this.props.deck.cards.length
            / this.props.players.length);
    }

    private resetDealModalState() {
        this.setState({
            amountPerPlayer: 7,
            reShuffleDeck: true,
        });
    }

    private setShowDealModal(show: boolean) {
        if (show) {
            this.resetDealModalState();
        }
        this.setState({ showDealModal: show });
    }

    private handleAmountPerPlayerChanged(event: any) {
        this.setState({
            amountPerPlayer: event.target.value
        });
    }

    private handleReShuffleDeckChanged(event: any) {
        this.setState({
            reShuffleDeck: event.target.checked
        });
    }

    private dealCards() {
        this.props.sendMessage({
            messageType: "deal_cards",
            deckId: this.props.deck.id,
            amountPerPlayer: this.state.amountPerPlayer,
            reShuffleDeck: this.state.reShuffleDeck,
        });
        this.setShowDealModal(false);
    }
    
    private onDragStart(data: DraggableData) {
        if (this.props.deck.cards.length > 0) {
            this.props.sendMessage({
                messageType: "pick_from_deck",
                deckId: this.props.deck.id,
                cardX: data.x,
                cardY: data.y,
            });
            this.setState({
                draggingCard:
                             this.props.deck.cards[
                                 this.props.deck.cards.length-1]});
        }
    }

    private onDragMove(data: DraggableData) {
        if (this.state.draggingCard) {
            this.props.sendMessage({
                messageType: "card_drag",
                cardX: data.x,
                cardY: data.y,
                cardId: this.state.draggingCard.id,
            });
        }
    }

    private onDragStop(data: DraggableData, e: any) {
        this.props.sendMessage({
            messageType: "card_release"
        });

        let loc = getLocObject(e);
        if (this.state.draggingCard) {
            this.props.cardDragReleaseHandler.release(
                this.state.draggingCard!, CardLocation.Deck,
                loc.pageX, loc.pageY, data.x, data.y);
        }

        this.setState({
            draggingCard: null,
        });
    }

    private getCardStackHeight() {
        const base = 3;
        const mult = .08;
        const max = 7;
        const val = base + mult * this.props.deck.cards.length;
        return Math.min(max,val);
    }
    public render() {
        let stackHeight = this.getCardStackHeight();
        let deckStyles = {
            borderBottomWidth: stackHeight,
            borderRightWidth: stackHeight -2,
        }
        return (
            <div className="deck" ref={this.props.deckRef} style={deckStyles}>
                <DropdownButton title="&#8942;" id="deck-menu-button"
                                style={{marginRight:"3px"}}
                                bsPrefix="custom-menu-btn">
                    <Dropdown.Item onClick={() => this.setShowDealModal(true)}>
                        Deal
                    </Dropdown.Item>
                    <Dropdown.Item onClick={this.recallToThisDeck.bind(this)}>
                        Recall
                    </Dropdown.Item>
                    <Dropdown.Item onClick={this.shuffleThisDeck.bind(this)}>
                        Shuffle
                    </Dropdown.Item>
                    <Dropdown.Item onClick={this.removeThisDeck.bind(this)}>
                        Remove
                    </Dropdown.Item>
                </DropdownButton>

                <DraggableCore
                    onStart={(e, data) => this.onDragStart(data)}
                    onDrag={(e, data) => this.onDragMove(data)}
                    onStop={(e, data) => this.onDragStop(data, e)}>
                    <div className="inner-deck" style={{backgroundColor: this.props.deck.color}}>
                        <div>
                            {this.props.deck.cards.length} cards
                        </div>
                    </div>
                </DraggableCore>

                <Modal show={this.state.showDealModal}
                       onHide={() => this.setShowDealModal(false)}
                       centered >
                    <Modal.Header closeButton>
                        <Modal.Title>Deal cards</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={(e:any) => {this.dealCards(); e.preventDefault();}}>
                            <Form.Group controlId="amountToDeal">
                                <Form.Label>Cards per player</Form.Label>
                                <Form.Control type="number"
                                              min={1}
                                              max={this.getMaxDeal()}
                                              value={Math.min(this.getMaxDeal(),
                       this.state.amountPerPlayer)}
                                              onChange={this.handleAmountPerPlayerChanged.bind(this)} />
                            </Form.Group>
                            <Form.Group controlId="reShuffleDeck">
                                <Form.Check
                                    id="reShuffleDeck"
                                    type="checkbox"
                                    label="Shuffle deck before dealing"
                                    checked={this.state.reShuffleDeck}
                                    onChange={this.handleReShuffleDeckChanged.bind(this)} />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.setShowDealModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={() => this.dealCards()}>
                            Deal
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

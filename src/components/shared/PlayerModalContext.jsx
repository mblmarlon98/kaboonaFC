import React, { Component, createContext } from 'react';
import PlayerModal from './PlayerModal';

// Create context
export const PlayerModalContext = createContext({
  openPlayerModal: () => {},
  closePlayerModal: () => {},
});

/**
 * Provider component that wraps the app and provides player modal functionality
 * Any PlayerFIFACard can use the context to open the modal
 */
class PlayerModalProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      player: null,
    };
  }

  openPlayerModal = (player) => {
    if (player) {
      this.setState({
        isOpen: true,
        player,
      });
    }
  };

  closePlayerModal = () => {
    this.setState({
      isOpen: false,
    });
  };

  render() {
    const { children } = this.props;
    const { isOpen, player } = this.state;

    return (
      <PlayerModalContext.Provider
        value={{
          openPlayerModal: this.openPlayerModal,
          closePlayerModal: this.closePlayerModal,
        }}
      >
        {children}
        <PlayerModal
          player={player}
          isOpen={isOpen}
          onClose={this.closePlayerModal}
        />
      </PlayerModalContext.Provider>
    );
  }
}

export default PlayerModalProvider;

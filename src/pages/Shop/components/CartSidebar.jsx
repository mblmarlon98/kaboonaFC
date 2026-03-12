import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cart sidebar/modal component
 * Shows cart items and checkout flow
 */
class CartSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isCheckingOut: false,
      checkoutStep: 0, // 0: cart, 1: shipping, 2: payment, 3: confirmation
    };
  }

  handleQuantityChange = (item, delta) => {
    const { onUpdateQuantity } = this.props;
    const newQuantity = item.quantity + delta;
    onUpdateQuantity(item.id, item.size, newQuantity);
  };

  handleRemoveItem = (item) => {
    const { onRemoveItem } = this.props;
    onRemoveItem(item.id, item.size);
  };

  handleStartCheckout = () => {
    this.setState({ isCheckingOut: true, checkoutStep: 1 });
  };

  handleNextStep = () => {
    this.setState((prevState) => ({
      checkoutStep: Math.min(prevState.checkoutStep + 1, 3),
    }));
  };

  handlePrevStep = () => {
    this.setState((prevState) => {
      if (prevState.checkoutStep <= 1) {
        return { isCheckingOut: false, checkoutStep: 0 };
      }
      return { checkoutStep: prevState.checkoutStep - 1 };
    });
  };

  handleConfirmOrder = () => {
    const { onClearCart, onClose } = this.props;
    // Show confirmation step
    this.setState({ checkoutStep: 3 });
    // Clear cart after a delay
    setTimeout(() => {
      onClearCart();
      this.setState({ isCheckingOut: false, checkoutStep: 0 });
      onClose();
    }, 3000);
  };

  renderCartItems = () => {
    const { items } = this.props;

    if (items.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64"
        >
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-display text-white mb-2">Your cart is empty</h3>
          <p className="text-gray-400 text-center">
            Browse our merchandise and add some items to your cart.
          </p>
        </motion.div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={`${item.id}-${item.size}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 bg-surface-dark-hover rounded-lg p-3"
            >
              {/* Item Image */}
              <div className="w-20 h-20 bg-surface-dark rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-accent-gold/30 font-display">
                    KFC
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>
                <p className="text-accent-gold font-semibold mt-1">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => this.handleQuantityChange(item, -1)}
                    className="w-6 h-6 flex items-center justify-center bg-surface-dark rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => this.handleQuantityChange(item, 1)}
                    className="w-6 h-6 flex items-center justify-center bg-surface-dark rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    +
                  </button>
                  <button
                    onClick={() => this.handleRemoveItem(item)}
                    className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  renderShippingForm = () => {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 overflow-y-auto py-4"
      >
        <h3 className="text-lg font-display text-white mb-4">Shipping Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Address</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">City</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">ZIP Code</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
                placeholder="10001"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  renderPaymentForm = () => {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 overflow-y-auto py-4"
      >
        <h3 className="text-lg font-display text-white mb-4">Payment Details</h3>
        <div className="bg-surface-dark-hover rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-400 text-center">
            This is a demo checkout. No real payments will be processed.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Card Number</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
              placeholder="4242 4242 4242 4242"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expiry</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">CVC</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
                placeholder="123"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  renderConfirmation = () => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
        >
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h3 className="text-2xl font-display text-white mb-2">Order Confirmed!</h3>
        <p className="text-gray-400 text-center mb-4">
          Thank you for your purchase. This is a demo order - no payment was processed.
        </p>
        <p className="text-sm text-accent-gold">Redirecting...</p>
      </motion.div>
    );
  };

  renderCheckoutSteps = () => {
    const { checkoutStep } = this.state;
    const steps = ['Cart', 'Shipping', 'Payment', 'Done'];

    return (
      <div className="flex items-center justify-center gap-2 py-4 border-b border-gray-800">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={`
                flex items-center gap-2
                ${index <= checkoutStep ? 'text-accent-gold' : 'text-gray-600'}
              `}
            >
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                  ${index < checkoutStep ? 'bg-accent-gold text-black' : ''}
                  ${index === checkoutStep ? 'bg-accent-gold/20 border border-accent-gold text-accent-gold' : ''}
                  ${index > checkoutStep ? 'bg-gray-800 text-gray-600' : ''}
                `}
              >
                {index < checkoutStep ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs hidden sm:inline">{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${index < checkoutStep ? 'bg-accent-gold' : 'bg-gray-700'}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  render() {
    const { isOpen, onClose, items, total } = this.props;
    const { isCheckingOut, checkoutStep } = this.state;

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-dark-elevated border-l border-gray-800 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-xl font-display text-white">
                  {isCheckingOut ? 'Checkout' : 'Shopping Cart'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Checkout Steps */}
              {isCheckingOut && checkoutStep < 3 && this.renderCheckoutSteps()}

              {/* Content */}
              <div className="flex-1 flex flex-col px-4 overflow-hidden">
                {!isCheckingOut && this.renderCartItems()}
                {isCheckingOut && checkoutStep === 1 && this.renderShippingForm()}
                {isCheckingOut && checkoutStep === 2 && this.renderPaymentForm()}
                {isCheckingOut && checkoutStep === 3 && this.renderConfirmation()}
              </div>

              {/* Footer */}
              {items.length > 0 && checkoutStep !== 3 && (
                <div className="border-t border-gray-800 p-4 space-y-4">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-2xl font-display font-bold text-accent-gold">
                      ${total.toFixed(2)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {!isCheckingOut ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={this.handleStartCheckout}
                      className="w-full py-3 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors"
                    >
                      Proceed to Checkout
                    </motion.button>
                  ) : (
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={this.handlePrevStep}
                        className="flex-1 py-3 bg-surface-dark-hover text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={checkoutStep === 2 ? this.handleConfirmOrder : this.handleNextStep}
                        className="flex-1 py-3 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors"
                      >
                        {checkoutStep === 2 ? 'Place Order' : 'Continue'}
                      </motion.button>
                    </div>
                  )}

                  {/* Demo Notice */}
                  <p className="text-xs text-gray-500 text-center">
                    This is a demo store. No real payments will be processed.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
}

export default CartSidebar;

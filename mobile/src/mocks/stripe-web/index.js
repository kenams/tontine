const React = require('react');

function StripeProvider({ children }) { return children; }
function useStripe() {
  return {
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
    confirmPayment: async () => ({ error: null, paymentIntent: null }),
    createToken: async () => ({ error: null, token: null }),
    createPaymentMethod: async () => ({ error: null, paymentMethod: null }),
  };
}

module.exports = { StripeProvider, useStripe };

const Customer  = require('./customer');
const Sale = require('../sales/Sales');
const CreditTranscation = require('./CreditTranscation');
const CustomerNofification = require('./CustomerNotification');
const CustomerBuyingPattern = require('./CustomerBuyingPattern');
const User = require('../user/User');
const Product = require('../inventory/Product');

module.exports = () =>{
    //Customer ->Sale 
    Customer.hasMany(Sale,{foreignKey:'C_ID'});
    Sale.belongsTo(Customer,{foreignKey:'C_ID'});

    //Customer -> Credit Transaction
    Customer.hasMany(CreditTranscation,{foreignKey:'Customer_ID'});
    CreditTranscation.belongsTo(Customer,{foreignKey:'Customer_ID'});

    //Customer -> Notification
    Customer.hasMany(CustomerNofification,{foreignKey:'Customer_ID'});
    CustomerNofification.belongsTo(Customer,{foreignKey:'Customer_ID'});

    //Customer -> Buying Pattern
    Customer.hasMany(CustomerBuyingPattern,{foreignKey:'Customer_ID'});
    CustomerBuyingPattern.belongsTo(Customer,{foreignKey:'Customer_ID'});

    // User → Notification (for Sent_By)
    User.hasMany(CustomerNofification, { foreignKey: 'Sent_By', as: 'SentNotifications' });
    CustomerNofification.belongsTo(User, { foreignKey: 'Sent_By', as: 'SentBy' });

    // Product → Buying Pattern
    Product.hasMany(CustomerBuyingPattern, { foreignKey: 'P_ID' });
    CustomerBuyingPattern.belongsTo(Product, { foreignKey: 'P_ID' });

    // Product → Notification
    Product.hasMany(CustomerNofification, { foreignKey: 'P_ID' });
    CustomerNofification.belongsTo(Product, { foreignKey: 'P_ID' });

}
// Import necessary libraries
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  ConfigProvider, 
  Layout, 
  Typography, 
  Button, 
  Card, 
  List, 
  Avatar, 
  Badge, 
  Drawer, 
  Input, 
  Form, 
  message, 
  Result,
  Spin,
  Divider,
  Space,
  Tag,
  Modal,
  Radio
} from 'antd';
import { 
  ShoppingCartOutlined, 
  QrcodeOutlined, 
  PlusOutlined, 
  MinusOutlined,
  DeleteOutlined,
  CheckOutlined,
  UserOutlined,
  CreditCardOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { createSlice, configureStore, createAsyncThunk } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import 'antd/dist/reset.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// Mock API data for menu items
const mockMenuItems = [
  {
    id: 1,
    name: 'Classic Burger',
    price: 18.99,
    description: 'Beef patty with lettuce, tomato, and cheese',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80'
  },
  {
    id: 2,
    name: 'Chicken Sandwich',
    price: 15.99,
    description: 'Grilled chicken breast with avocado and mayo',
    image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80'
  },
  {
    id: 3,
    name: 'Caesar Salad',
    price: 14.50,
    description: 'Fresh romaine lettuce with Caesar dressing and croutons',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80'
  },
  {
    id: 4,
    name: 'French Fries',
    price: 8.50,
    description: 'Crispy golden fries with sea salt',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80'
  },
  {
    id: 5,
    name: 'Chocolate Milkshake',
    price: 10.99,
    description: 'Rich chocolate shake with whipped cream',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80'
  },
];

// Redux slice for cart
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
    loading: false,
    error: null,
    orderPlaced: false,
    tableNumber: null,
    savedOrder: null
  },
  reducers: {
    addToCart: (state, action) => {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      
      state.totalAmount = calculateTotal(state.items);
    },
    removeFromCart: (state, action) => {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex >= 0) {
        if (state.items[existingItemIndex].quantity === 1) {
          state.items = state.items.filter(item => item.id !== action.payload.id);
        } else {
          state.items[existingItemIndex].quantity -= 1;
        }
        
        state.totalAmount = calculateTotal(state.items);
      }
    },
    deleteFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload.id);
      state.totalAmount = calculateTotal(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
    },
    setTableNumber: (state, action) => {
      state.tableNumber = action.payload;
    },
    resetOrder: (state) => {
      state.orderPlaced = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.savedOrder = action.payload.orderData;
        state.items = [];
        state.totalAmount = 0;
        state.orderPlaced = true;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Helper function to calculate total
const calculateTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Async thunk for placing an order
const placeOrder = createAsyncThunk(
  'cart/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      // In a real app, this would be an actual API call
      // For demo purposes, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return the order data so we can save it for the confirmation screen
      return { success: true, orderData };
    } catch (error) {
      return rejectWithValue('Failed to place order. Please try again.');
    }
  }
);

// Redux store
const store = configureStore({
  reducer: {
    cart: cartSlice.reducer
  }
});

// QR Code Scanner Component
const QRScanner = ({ onScanSuccess }) => {
  const [scanStarted, setScanStarted] = useState(false);
  
  useEffect(() => {
    let scanner;
    let isHandled = false;
    
    if (scanStarted) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render(
        (decodedText) => {
          if (isHandled) return;
          isHandled = true;
          try {
            const tableData = JSON.parse(decodedText);
            if (tableData && tableData.tableNumber) {
              onScanSuccess(tableData.tableNumber);
              setTimeout(() => {
                scanner.clear();
                setScanStarted(false);
              }, 300);
            }
          } catch (e) {
            message.error('Invalid QR code. Please scan a valid table QR code.');
            setTimeout(() => {
              scanner.clear();
              setScanStarted(false);
            }, 300);
          }
        },
        (error) => {
          console.warn(error);
        }
      );
    }
    
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanStarted, onScanSuccess]);
  
  return (
    <div style={{ textAlign: 'center' }}>
      {!scanStarted ? (
        <div>
          <Button 
            type="primary" 
            icon={<QrcodeOutlined />} 
            size="large"
            onClick={() => setScanStarted(true)}
          >
            Scan QR Code
          </Button>
          <Divider>OR</Divider>
          <Button 
            type="default"
            onClick={() => onScanSuccess("Demo-123")}
          >
            Use Demo Table (123)
          </Button>
        </div>
      ) : (
        <div>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
          <Button onClick={() => setScanStarted(false)} style={{ marginTop: '10px' }}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ item }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const itemInCart = cartItems.find((cartItem) => cartItem.id === item.id);
  const quantity = itemInCart ? itemInCart.quantity : 0;
  
  return (
    <Card
      hoverable
      style={{ marginBottom: '16px' }}
    >
      <div style={{ display: 'flex' }}>
        <Avatar src={item.image} size={64} shape="square" />
        <div style={{ marginLeft: '16px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Title level={5}>{item.name}</Title>
            <Text strong>RM{item.price.toFixed(2)}</Text>
          </div>
          <Text type="secondary">{item.description}</Text>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            {quantity > 0 ? (
              <Space>
                <Button 
                  shape="circle" 
                  icon={<MinusOutlined />} 
                  onClick={() => dispatch(cartSlice.actions.removeFromCart(item))}
                />
                <Text strong>{quantity}</Text>
                <Button 
                  shape="circle" 
                  icon={<PlusOutlined />} 
                  type="primary"
                  onClick={() => dispatch(cartSlice.actions.addToCart(item))}
                />
              </Space>
            ) : (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => dispatch(cartSlice.actions.addToCart(item))}
              >
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Cart Component
const Cart = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const { items, totalAmount, loading } = useSelector((state) => state.cart);
  const [form] = Form.useForm();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  const handleCheckout = (values) => {
    const orderData = {
      items, 
      totalAmount, 
      customerInfo: values,
      paymentMethod,
      orderTime: new Date().toLocaleString()
    };
    
    dispatch(placeOrder(orderData));
    onClose();
  };
  
  return (
    <Drawer
      title="Your Order"
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            onClick={() => form.submit()}
            loading={loading}
            disabled={items.length === 0}
          >
            Place Order (RM{totalAmount.toFixed(2)})
          </Button>
        </div>
      }
    >
      {items.length === 0 ? (
        <Result
          status="info"
          title="Your cart is empty"
          subTitle="Add items from the menu to place an order"
        />
      ) : (
        <>
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    danger
                    onClick={() => dispatch(cartSlice.actions.deleteFromCart(item))}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.image} shape="square" />}
                  title={item.name}
                  description={`RM${item.price.toFixed(2)} x ${item.quantity}`}
                />
                <div>RM{(item.price * item.quantity).toFixed(2)}</div>
              </List.Item>
            )}
          />
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Text strong>Total:</Text>
            <Text strong>RM{totalAmount.toFixed(2)}</Text>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCheckout}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Your Name" />
            </Form.Item>
            <Form.Item
              name="notes"
              label="Special Instructions (Optional)"
            >
              <Input.TextArea rows={2} placeholder="Allergies, special requests, etc." />
            </Form.Item>
            <Form.Item
              label="Payment Method"
              required
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Radio.Button value="duitnow" style={{ width: '100%', marginBottom: '8px' }}>
                    <Space>
                      <CreditCardOutlined />
                      DuitNow (QR/Online Banking)
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="tng" style={{ width: '100%', marginBottom: '8px' }}>
                    <Space>
                      <CreditCardOutlined />
                      Touch 'n Go eWallet
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="grabpay" style={{ width: '100%', marginBottom: '8px' }}>
                    <Space>
                      <CreditCardOutlined />
                      GrabPay
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="card" style={{ width: '100%', marginBottom: '8px' }}>
                    <Space>
                      <CreditCardOutlined />
                      Credit/Debit Card
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="cash" style={{ width: '100%' }}>
                    <Space>
                      <CreditCardOutlined />
                      Cash
                    </Space>
                  </Radio.Button>
                </Radio.Group>
              </Space>
            </Form.Item>
            {paymentMethod === 'card' && (
              <Form.Item
                name="cardNumber"
                label="Card Number"
                rules={[{ required: true, message: 'Please enter card number' }]}
              >
                <Input placeholder="1234 5678 9012 3456" />
              </Form.Item>
            )}
          </Form>
        </>
      )}
    </Drawer>
  );
};

// Order Success Component
const OrderSuccess = ({ onNewOrder }) => {
  const { tableNumber } = useSelector((state) => state.cart);
  const orderDetails = useSelector((state) => {
    // Get the saved order data from the most recent order
    return {
      items: state.cart.savedOrder?.items || [],
      totalAmount: state.cart.savedOrder?.totalAmount || 0,
      orderTime: state.cart.savedOrder?.orderTime || new Date().toLocaleString(),
      paymentMethod: state.cart.savedOrder?.paymentMethod || 'cash'
    };
  });
  
  // Payment method display names
  const paymentMethodLabels = {
    duitnow: 'DuitNow',
    tng: 'Touch \'n Go eWallet',
    grabpay: 'GrabPay',
    card: 'Credit/Debit Card',
    cash: 'Cash'
  };

  return (
    <Card 
      style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        marginTop: '50px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <Result
        status="success"
        title="Order Placed Successfully!"
        subTitle={`Your order has been placed and will be served to your table soon.`}
      />
      
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Text strong>Order Details</Text>
            <Text type="secondary">Table {tableNumber}</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text>Order Time:</Text>
            <Text>{orderDetails.orderTime}</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text>Payment Method:</Text>
            <Text>{paymentMethodLabels[orderDetails.paymentMethod]}</Text>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>
            Items Ordered
          </Text>
          
          <List
            itemLayout="horizontal"
            dataSource={orderDetails.items}
            renderItem={(item) => (
              <List.Item
                style={{ padding: '8px 0' }}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.image} shape="square" />}
                  title={item.name}
                  description={`RM${item.price.toFixed(2)} x ${item.quantity}`}
                />
                <div>RM{(item.price * item.quantity).toFixed(2)}</div>
              </List.Item>
            )}
          />
          
          <Divider style={{ margin: '12px 0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>Total:</Text>
            <Text strong>RM{orderDetails.totalAmount.toFixed(2)}</Text>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button type="primary" size="large" onClick={onNewOrder}>
            Place Another Order
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Main App Component
const App = () => {
  const dispatch = useDispatch();
  const { tableNumber, orderPlaced, loading } = useSelector((state) => state.cart);
  const [cartVisible, setCartVisible] = useState(false);
  
  const handleScanSuccess = (tableNumber) => {
    dispatch(cartSlice.actions.setTableNumber(tableNumber));
    message.success(`Table ${tableNumber} selected`);
  };
  
  const cartItems = useSelector((state) => state.cart.items);
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const handleNewOrder = () => {
    dispatch(cartSlice.actions.resetOrder());
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Processing your order..." />
      </div>
    );
  }
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            QR Order
          </Title>
        </div>
        {tableNumber && !orderPlaced && (
          <div>
            <Badge count={totalQuantity}>
              <Button 
                type="primary" 
                icon={<ShoppingCartOutlined />} 
                size="large"
                onClick={() => setCartVisible(true)}
              >
                Cart
              </Button>
            </Badge>
          </div>
        )}
      </Header>
      
      <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {!tableNumber ? (
          <Card style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', marginTop: '50px' }}>
            <Title level={3}>Welcome to QR Order</Title>
            <Text style={{ display: 'block', marginBottom: '24px' }}>
              Scan the QR code on your table to start ordering
            </Text>
            <QRScanner onScanSuccess={handleScanSuccess} />
          </Card>
        ) : orderPlaced ? (
          <OrderSuccess onNewOrder={handleNewOrder} />
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={2} style={{ marginBottom: 0 }}>Menu</Title>
                <Tag color="blue">Table {tableNumber}</Tag>
              </div>
            </div>
            <div>
              {mockMenuItems.map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </Content>
      
      <Footer style={{ textAlign: 'center', background: '#001529', color: 'white', padding: '12px' }}>
        <div>
          <Title level={5} style={{ color: 'white', margin: 0, marginBottom: '4px' }}>
            Taste of Malaysia Restaurant
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}>
            Authentic Malaysian Cuisine • Est. 2023 • Kuala Lumpur
          </Text>
        </div>
      </Footer>
      
      <Cart 
        visible={cartVisible} 
        onClose={() => setCartVisible(false)} 
      />
    </Layout>
  );
};

// Root component
const Root = () => (
  <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
    <Provider store={store}>
      <App />
    </Provider>
  </ConfigProvider>
);

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />); 
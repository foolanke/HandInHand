from flask import Flask
from flask_cors import CORS
from routes.asl_routes import asl_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Register blueprints
app.register_blueprint(asl_bp, url_prefix='/api/asl')

@app.route('/')
def home():
    return {'message': 'ASL Backend API Running'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)
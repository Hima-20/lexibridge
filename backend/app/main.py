from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient, errors
from bson import ObjectId
from datetime import datetime
import os
import fitz  # PyMuPDF
import bcrypt
import jwt
from groq import Groq
from typing import Optional
import shutil
import tempfile
import uuid
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Lexibridge - AI Legal Document Interpretation",
    description="AI-powered legal document analysis and summarization",
    version="1.0.0"
)

# CORS middleware - Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://lexibridge.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Security
security = HTTPBearer()

# Database setup
db = None
users_collection = None
documents_collection = None
responses_collection = None

try:
    # MongoDB connection
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    print(f"🔗 Connecting to MongoDB: {MONGO_URL.split('@')[-1] if '@' in MONGO_URL else MONGO_URL}")
    
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connected successfully")
    
    db = client["lexibridge"]
    
    # Collections
    users_collection = db["users"]
    documents_collection = db["documents"]
    responses_collection = db["responses"]
    
    # Create indexes
    users_collection.create_index("email", unique=True)
    users_collection.create_index("username", unique=True)
    documents_collection.create_index("userId")
    responses_collection.create_index("userId")
    
    print("✅ Database collections initialized")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("⚠️  Using in-memory database (data will be lost on restart)")
    # Create in-memory collections as fallback
    class InMemoryCollection:
        def __init__(self):
            self.data = []
            self._id_counter = 1
            
        def find_one(self, query):
            if query == {}:
                return None
            for item in self.data:
                match = True
                for key, value in query.items():
                    if key == "_id":
                        if str(item.get("_id")) != str(value):
                            match = False
                            break
                    elif item.get(key) != value:
                        match = False
                        break
                if match:
                    return item
            return None
            
        def insert_one(self, document):
            document["_id"] = self._id_counter
            self.data.append(document)
            self._id_counter += 1
            return type('obj', (object,), {'inserted_id': document["_id"]})()
            
        def find(self, query=None):
            if query is None:
                return self.data.copy()
            return [item for item in self.data if all(item.get(k) == v for k, v in query.items())]
            
        def update_one(self, query, update):
            item = self.find_one(query)
            if item:
                if "$set" in update:
                    item.update(update["$set"])
                if "$push" in update:
                    for key, value in update["$push"].items():
                        if key not in item:
                            item[key] = []
                        item[key].append(value)
            return type('obj', (object,), {'matched_count': 1 if item else 0})()
            
        def count_documents(self, query):
            return len(self.find(query))
    
    users_collection = InMemoryCollection()
    documents_collection = InMemoryCollection()
    responses_collection = InMemoryCollection()

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

# Initialize Groq client
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Groq client: {e}")
        groq_client = None
else:
    print("⚠️  Groq API key not configured or using default key")

# Helper Functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except:
        return False

def create_access_token(data: dict) -> str:
    """Create JWT access token with 24-hour expiry"""
    to_encode = data.copy()
    import time
    to_encode.update({"exp": time.time() + 86400})  # 24 hours
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        print(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

def extract_text_from_pdf(pdf_file: UploadFile) -> str:
    """Extract text from uploaded PDF file"""
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = pdf_file.file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Extract text using PyMuPDF
        text = ""
        doc = fitz.open(tmp_file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        # Clean text
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:10000]  # Limit to 10000 characters for AI processing
    except Exception as e:
        print(f"PDF extraction error: {e}")
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")

def analyze_document_with_ai(document_text: str, question: str = None) -> str:
    """Analyze document with Groq AI"""
    if not groq_client:
        # Mock response for testing when AI is not available
        print("⚠️  Using mock AI response (Groq not configured)")
        if question:
            return f"Mock AI Response to: {question}\n\nThis is a mock response since the AI service is not configured. Please set up Groq API key in .env file.\n\nDocument preview: {document_text[:500]}..."
        else:
            return """# Document Analysis (Mock)

## Summary
This is a mock analysis since the AI service is not configured.

## Key Points
1. Mock point one
2. Mock point two
3. Mock point three

## Recommendations
Set up Groq API key in .env file for real AI analysis.

**Disclaimer:** This is mock data for testing purposes only."""
    
    # Prepare context
    if question:
        prompt = f"""You are Lexibridge, an AI legal document interpretation assistant.

Document Content (first 3000 characters):
{document_text[:3000]}

User Question: {question}

Please analyze this legal document and provide a comprehensive response to the user's question.
Structure your response with clear sections and bullet points where appropriate.
"""
    else:
        prompt = f"""You are Lexibridge, an AI legal document interpretation assistant.

Document Content (first 3000 characters):
{document_text[:3000]}

Please analyze this legal document and provide a comprehensive summary including:
1. Document Type and Purpose
2. Key Parties and Their Roles
3. Main Obligations and Responsibilities
4. Important Dates and Deadlines
5. Payment Terms (if applicable)
6. Termination Clauses
7. Liability and Indemnity Provisions
8. Confidentiality Requirements
9. Dispute Resolution Methods
10. Potential Risks and Red Flags

Structure your response in clear sections with bullet points.
"""
    
    # Add legal disclaimer
    prompt += """

IMPORTANT DISCLAIMER: I am an AI assistant and not a lawyer. 
This information is for educational purposes only and does not constitute legal advice. 
Always consult with a qualified attorney for legal matters.
"""
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful legal document interpretation assistant. Provide clear, accurate, and concise explanations of legal documents and concepts. Always include appropriate disclaimers. Use markdown-like formatting with headings and bullet points for readability."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="openai/gpt-oss-120b",
            temperature=0.3,
            max_tokens=2000
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"AI Service Error: {e}")
        return f"AI analysis failed: {str(e)}. Please try again later."

async def get_current_user(payload: dict = Depends(verify_token)) -> dict:
    """Get current user from token payload"""
    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id) if isinstance(user_id, str) and ObjectId.is_valid(user_id) else user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        print(f"Get current user error: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid user ID: {str(e)}")

# Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "success": True,
        "message": "Lexibridge API is running",
        "status": "active",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if db is not None else "in-memory",
        "ai_service": "available" if groq_client else "mock"
    }

@app.get("/health")
async def health_check():
    """Health check for frontend"""
    return {
        "success": True,
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "connected" if db else "in-memory",
            "ai_service": "available" if groq_client else "mock"
        }
    }

@app.post("/register")
async def register(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    """Register a new user"""
    print(f"📝 Registration attempt: {email}, {username}")
    
    # Validation
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    
    # Check if user exists
    existing_user = users_collection.find_one({
        "$or": [
            {"email": email},
            {"username": username}
        ]
    })
    
    if existing_user:
        if existing_user.get("email") == email:
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password
    hashed_password = hash_password(password)
    
    # Create user
    user_doc = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "fullName": username,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "chatHistory": []
    }
    
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id) if hasattr(result, 'inserted_id') else str(user_doc["_id"])
    
    # Create token
    access_token = create_access_token({
        "email": email,
        "username": username,
        "userId": user_id
    })
    
    print(f"✅ User registered successfully: {user_id}")
    
    return {
        "success": True,
        "message": "Registration successful",
        "user": {
            "id": user_id,
            "username": username,
            "email": email,
            "fullName": username
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...)
):
    """Login user"""
    print(f"🔑 Login attempt: {email}")
    
    # Find user
    db_user = users_collection.find_one({"email": email})
    
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    access_token = create_access_token({
        "email": db_user["email"],
        "username": db_user["username"],
        "userId": str(db_user["_id"])
    })
    
    print(f"✅ User logged in successfully: {db_user['username']}")
    
    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": str(db_user["_id"]),
            "username": db_user["username"],
            "email": db_user["email"],
            "fullName": db_user.get("fullName", db_user["username"])
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload PDF document and extract text"""
    print(f"📤 Upload document attempt by: {current_user['username']}, File: {file.filename}")
    
    # Check file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Check file size (max 25MB)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > 25 * 1024 * 1024:  # 25MB
        raise HTTPException(status_code=400, detail="File size exceeds 25MB limit")
    
    # Extract text
    try:
        extracted_text = extract_text_from_pdf(file)
        print(f"✅ Text extracted successfully: {len(extracted_text)} characters")
    except Exception as e:
        print(f"❌ Text extraction failed: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")
    
    # Create document (without AI analysis yet)
    document_doc = {
        "documentName": file.filename,
        "originalFilename": file.filename,
        "documentContent": extracted_text,
        "aiSummary": "",  # Will be filled when user clicks "Analyze with AI"
        "userId": str(current_user["_id"]),
        "userName": current_user["username"],
        "fileSize": file_size,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "analysisStatus": "pending"  # pending, analyzing, completed
    }
    
    # Save to database
    result = documents_collection.insert_one(document_doc)
    document_id = str(result.inserted_id) if hasattr(result, 'inserted_id') else str(document_doc["_id"])
    
    print(f"✅ Document saved to database: {document_id}")
    
    return {
        "success": True,
        "message": "Document uploaded successfully",
        "documentId": document_id,
        "documentName": file.filename,
        "extractedTextLength": len(extracted_text),
        "fileSize": file_size,
        "analysisStatus": "pending"
    }

@app.post("/analyze-document")
async def analyze_document(
    documentId: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Analyze document with AI (triggered by "Analyze with AI" button)"""
    print(f"🤖 AI analysis requested for document: {documentId} by user: {current_user['username']}")
    
    # Get document
    try:
        # Try to convert to ObjectId if it looks like one
        try:
            doc_id = ObjectId(documentId) if ObjectId.is_valid(documentId) else documentId
        except:
            doc_id = documentId
            
        document = documents_collection.find_one({
            "_id": doc_id,
            "userId": str(current_user["_id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document_content = document.get("documentContent", "")
        if not document_content:
            raise HTTPException(status_code=400, detail="Document has no content to analyze")
        
        print(f"✅ Document found: {document.get('documentName', 'Unknown')}, Content length: {len(document_content)}")
        
    except Exception as e:
        print(f"❌ Document fetch error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid document: {str(e)}")
    
    # Analyze with AI
    try:
        print("🔄 Starting AI analysis...")
        ai_summary = analyze_document_with_ai(document_content)
        print("✅ AI analysis completed")
        
    except Exception as e:
        print(f"❌ AI analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
    
    # Update document with AI summary
    try:
        documents_collection.update_one(
            {"_id": document.get("_id")},
            {
                "$set": {
                    "aiSummary": ai_summary,
                    "analysisStatus": "completed",
                    "analyzedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
    except Exception as e:
        print(f"⚠️  Failed to update document: {e}")
    
    # Create response record
    response_id = str(uuid.uuid4())
    response_doc = {
        "responseId": response_id,
        "userId": str(current_user["_id"]),
        "userName": current_user["username"],
        "documentId": documentId,
        "documentName": document.get("documentName", "Unknown"),
        "userMessage": "Analyze this document",
        "aiResponse": ai_summary,
        "timestamp": datetime.utcnow(),
        "type": "document_analysis"
    }
    
    try:
        responses_collection.insert_one(response_doc)
    except Exception as e:
        print(f"⚠️  Failed to save response: {e}")
    
    # Update user history
    try:
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {
                "$push": {
                    "chatHistory": {
                        "responseId": response_id,
                        "documentId": documentId,
                        "documentName": document.get("documentName", "Unknown"),
                        "userMessage": "Analyze this document",
                        "aiResponse": ai_summary[:500] + "..." if len(ai_summary) > 500 else ai_summary,
                        "timestamp": datetime.utcnow()
                    }
                }
            }
        )
    except Exception as e:
        print(f"⚠️  Failed to update user history: {e}")
    
    return {
        "success": True,
        "message": "Document analyzed successfully",
        "responseId": response_id,
        "documentId": documentId,
        "documentName": document.get("documentName", "Unknown"),
        "aiSummary": ai_summary,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/ask-ai")
async def ask_ai(
    question: str = Form(...),
    documentId: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Ask AI a question about a document"""
    print(f"❓ AI question: {question}, Document: {documentId}, User: {current_user['username']}")
    
    user_id = str(current_user["_id"])
    document_content = ""
    document_name = "General Question"
    
    # Get document if provided
    if documentId:
        try:
            # Try to convert to ObjectId if it looks like one
            try:
                doc_id = ObjectId(documentId) if ObjectId.is_valid(documentId) else documentId
            except:
                doc_id = documentId
                
            document = documents_collection.find_one({
                "_id": doc_id,
                "userId": user_id
            })
            
            if document:
                document_content = document.get("documentContent", "")
                document_name = document.get("documentName", "Unknown")
        except Exception as e:
            print(f"⚠️  Error fetching document: {e}")
            # Continue without document context
    
    # Analyze with AI
    try:
        ai_response = analyze_document_with_ai(document_content, question)
        
        # Save response
        response_id = str(uuid.uuid4())
        response_doc = {
            "responseId": response_id,
            "userId": user_id,
            "userName": current_user["username"],
            "documentId": documentId,
            "documentName": document_name,
            "userMessage": question,
            "aiResponse": ai_response,
            "timestamp": datetime.utcnow(),
            "type": "question"
        }
        
        try:
            responses_collection.insert_one(response_doc)
        except Exception as e:
            print(f"⚠️  Failed to save response: {e}")
        
        # Update user history
        try:
            users_collection.update_one(
                {"_id": current_user["_id"]},
                {
                    "$push": {
                        "chatHistory": {
                            "responseId": response_id,
                            "documentId": documentId,
                            "documentName": document_name,
                            "userMessage": question,
                            "aiResponse": ai_response[:500] + "..." if len(ai_response) > 500 else ai_response,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )
        except Exception as e:
            print(f"⚠️  Failed to update user history: {e}")
        
        return {
            "success": True,
            "responseId": response_id,
            "userMessage": question,
            "aiResponse": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"❌ AI service error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.get("/documents")
async def get_user_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents for current user"""
    try:
        documents = list(documents_collection.find(
            {"userId": str(current_user["_id"])}
        ))
        documents = sorted(documents, key=lambda x: x.get("createdAt", datetime.min), reverse=True)
        
        return {
            "success": True,
            "documents": [
                {
                    "id": str(doc["_id"]),
                    "documentName": doc["documentName"],
                    "originalFilename": doc.get("originalFilename", ""),
                    "createdAt": doc.get("createdAt", datetime.utcnow()),
                    "updatedAt": doc.get("updatedAt", datetime.utcnow()),
                    "fileSize": doc.get("fileSize", 0),
                    "hasSummary": bool(doc.get("aiSummary")),
                    "analysisStatus": doc.get("analysisStatus", "pending"),
                    "summaryPreview": doc.get("aiSummary", "")[:150] + "..." if doc.get("aiSummary") else None
                }
                for doc in documents
            ]
        }
    except Exception as e:
        print(f"❌ Error getting documents: {e}")
        return {
            "success": True,
            "documents": []
        }

@app.get("/documents/{document_id}")
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific document with content"""
    try:
        # Try to convert to ObjectId if it looks like one
        try:
            doc_id = ObjectId(document_id) if ObjectId.is_valid(document_id) else document_id
        except:
            doc_id = document_id
            
        document = documents_collection.find_one({
            "_id": doc_id,
            "userId": str(current_user["_id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "success": True,
            "document": {
                "id": str(document["_id"]),
                "documentName": document["documentName"],
                "originalFilename": document.get("originalFilename", ""),
                "documentContent": document.get("documentContent", ""),
                "aiSummary": document.get("aiSummary", ""),
                "createdAt": document.get("createdAt", datetime.utcnow()),
                "updatedAt": document.get("updatedAt", datetime.utcnow()),
                "fileSize": document.get("fileSize", 0),
                "analysisStatus": document.get("analysisStatus", "pending"),
                "analyzedAt": document.get("analyzedAt")
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting document: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid document ID: {str(e)}")

@app.get("/chat-history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    """Get user's chat history"""
    try:
        user_responses = list(responses_collection.find(
            {"userId": str(current_user["_id"])}
        ))
        user_responses = sorted(user_responses, key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:50]
        
        return {
            "success": True,
            "responses": [
                {
                    "responseId": resp.get("responseId", ""),
                    "documentId": resp.get("documentId"),
                    "documentName": resp.get("documentName", "Unknown"),
                    "userMessage": resp.get("userMessage", ""),
                    "aiResponse": resp.get("aiResponse", ""),
                    "timestamp": resp.get("timestamp", datetime.utcnow()),
                    "type": resp.get("type", "question")
                }
                for resp in user_responses
            ]
        }
    except Exception as e:
        print(f"❌ Error getting chat history: {e}")
        return {
            "success": True,
            "responses": []
        }

@app.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    try:
        # Get stats
        doc_count = documents_collection.count_documents({"userId": str(current_user["_id"])})
        chat_count = responses_collection.count_documents({"userId": str(current_user["_id"])})
    except:
        doc_count = 0
        chat_count = 0
    
    return {
        "success": True,
        "profile": {
            "id": str(current_user["_id"]),
            "username": current_user["username"],
            "email": current_user["email"],
            "fullName": current_user.get("fullName", current_user["username"]),
            "createdAt": current_user.get("createdAt", datetime.utcnow()),
            "stats": {
                "totalDocuments": doc_count,
                "totalChats": chat_count
            }
        }
    }

@app.get("/check-auth")
async def check_auth(current_user: dict = Depends(get_current_user)):
    """Check if user is authenticated"""
    return {
        "success": True,
        "authenticated": True,
        "user": {
            "id": str(current_user["_id"]),
            "username": current_user["username"],
            "email": current_user["email"],
            "fullName": current_user.get("fullName", current_user["username"])
        }
    }

# Test endpoint for file upload without auth
@app.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    """Test upload endpoint (no auth required)"""
    try:
        extracted_text = extract_text_from_pdf(file)
        return {
            "success": True,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size,
            "extracted_length": len(extracted_text),
            "preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Create a test user on startup
@app.on_event("startup")
async def startup_event():
    """Create test user on startup"""
    try:
        # Check if test user exists
        test_user = users_collection.find_one({"email": "test@example.com"})
        if not test_user:
            # Create test user
            hashed_password = hash_password("Testpass123")
            user_doc = {
                "username": "testuser",
                "email": "test@example.com",
                "password": hashed_password,
                "fullName": "Test User",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "chatHistory": []
            }
            users_collection.insert_one(user_doc)
            print("✅ Test user created: test@example.com / Testpass123")
    except Exception as e:
        print(f"⚠️  Could not create test user: {e}")

# if __name__ == "__main__":
#     import uvicorn
    
#     print("\n" + "="*60)
#     print("🚀 LEXIBRIDGE BACKEND SERVER")
#     print("="*60)
#     print(f"📁 Database: {'✅ Connected' if db else '⚠️  In-memory'}")
#     print(f"🤖 AI Service: {'✅ Available' if groq_client else '⚠️  Mock (configure GROQ_API_KEY)'}")
#     print(f"🔐 JWT Secret: {'✅ Loaded' if JWT_SECRET else '⚠️  Using default'}")
#     print("="*60)
#     print("📚 API Documentation: https://lexibridge-guax.onrender.com/docs")
#     print("🌐 Frontend URL: http://localhost:3000")
#     print("👤 Test User: test@example.com / Testpass123")
#     print("="*60 + "\n")
    
    # port = int(os.getenv("PORT", 8000))
    # uvicorn.run(app, host="0.0.0.0", port=port, reload=True)
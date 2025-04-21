# train_model.py

import pandas as pd
from datasets import load_dataset
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import pickle

# Step 1: Load the dataset from Hugging Face
print("Loading dataset from Hugging Face...")
dataset = load_dataset("liar", split="train", trust_remote_code=True)

# Step 2: Convert to pandas DataFrame
df = dataset.to_pandas()
df = df[['statement', 'label']].dropna()
df.columns = ['text', 'label']

# Step 3: Simplify label - fake (4,5) vs real (0,1)
print("Simplifying labels for binary classification...")
fake_labels = [4, 5]  # False, Pants-fire
real_labels = [0, 1]  # True, Mostly-true

df['label'] = df['label'].apply(lambda x: 0 if x in fake_labels else 1)  # 0 = FAKE, 1 = REAL

# Step 4: Train-Test Split
print("Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], test_size=0.2, random_state=42)

# Step 5: TF-IDF Vectorization
print("Vectorizing text...")
vectorizer = TfidfVectorizer(stop_words='english', max_df=0.7)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Step 6: Train Model
print("Training model...")
model = LogisticRegression()
model.fit(X_train_vec, y_train)

# Step 7: Evaluate
print("Evaluating...")
y_pred = model.predict(X_test_vec)
print(classification_report(y_test, y_pred))

# Step 8: Save model and vectorizer
print("Saving model and vectorizer...")
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("Model training complete and saved as 'model.pkl' and 'vectorizer.pkl'.")

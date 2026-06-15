# ml_model/train_model.py

import pandas as pd
import re
import pickle
from datasets import load_dataset
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report, accuracy_score

# Step 1: Load the dataset from Hugging Face
print("Loading liar dataset from Hugging Face...")
dataset = load_dataset("ucsbai/liar", split="train", trust_remote_code=True)

# Step 2: Convert to pandas DataFrame
df = dataset.to_pandas()
df = df[['statement', 'label']].dropna()
df.columns = ['text', 'label']

# Step 3: Correct label mappings for binary classification
# liar labels: 0=false, 1=half-true, 2=mostly-true, 3=true, 4=barely-true, 5=pants-fire
# Grouping:
# FAKE (0): 0 (false), 4 (barely-true), 5 (pants-fire)
# REAL (1): 1 (half-true), 2 (mostly-true), 3 (true)
print("Mapping labels: [0, 4, 5] -> FAKE (0), [1, 2, 3] -> REAL (1)")
fake_labels = [0, 4, 5]
real_labels = [1, 2, 3]

df['label'] = df['label'].apply(lambda x: 0 if x in fake_labels else 1)

# Step 4: Text Preprocessing
print("Preprocessing text data...")
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text) # Remove punctuation
    text = re.sub(r'\s+', ' ', text).strip()   # Remove extra whitespaces
    return text

df['text'] = df['text'].apply(preprocess_text)

# Step 5: Train-Test Split
print("Splitting data into train/test sets...")
X_train, X_test, y_train, y_test = train_test_split(
    df['text'], df['label'], test_size=0.2, random_state=42, stratify=df['label']
)

# Step 6: TF-IDF Vectorization
print("Vectorizing text using TF-IDF...")
vectorizer = TfidfVectorizer(stop_words='english', max_df=0.7, ngram_range=(1, 2))
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Step 7: Train and evaluate multiple models
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, C=1.0),
    "Multinomial Naive Bayes": MultinomialNB(alpha=1.0),
    "Linear Support Vector Classifier": LinearSVC(max_iter=2000, C=1.0)
}

best_model = None
best_accuracy = 0.0
best_model_name = ""

for name, clf in models.items():
    print(f"\n--- Training {name} ---")
    clf.fit(X_train_vec, y_train)
    y_pred = clf.predict(X_test_vec)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=["FAKE", "REAL"]))
    
    if acc > best_accuracy:
        best_accuracy = acc
        best_model = clf
        best_model_name = name

print(f"\n[BEST MODEL]: {best_model_name} with Accuracy: {best_accuracy:.4f}")

# Step 8: Save best model and vectorizer
print("Saving best model and vectorizer...")
with open("model.pkl", "wb") as f:
    pickle.dump(best_model, f)

with open("vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("Model training complete and saved as 'model.pkl' and 'vectorizer.pkl'.")

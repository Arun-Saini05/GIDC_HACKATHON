
import pandas as pd
try:
    df = pd.read_csv('cleaned_crime_dataset_ready.csv', encoding='utf-8')
except UnicodeDecodeError:
    df = pd.read_csv('cleaned_crime_dataset_ready.csv', encoding='latin1')

print("Columns:", df.columns.tolist())
print("First row:", df.iloc[0].to_dict())

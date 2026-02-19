
import json
import os

notebook_path = r'c:/Users/aruns/OneDrive/Desktop/Crime Prediction/Crime_Detection_Model.ipynb'

def fix_notebook():
    try:
        with open(notebook_path, 'r', encoding='utf-8') as f:
            nb = json.load(f)
        
        # Look for the Visualization Cell
        cell_found = False
        for cell in nb['cells']:
            if cell['cell_type'] == 'code':
                source_text = ''.join(cell['source'])
                if "df_map_predicted = gdf_predicted_state[[" in source_text and ".set_index('DISTRICT')" in source_text:
                    print("Found Visualization Cell.")
                    
                    # We need to modify the line where df_map_predicted is created to drop duplicates
                    # Original line might look like:
                    # ]].set_index('DISTRICT')
                    
                    # We will replace lines to ensure uniqueness
                    new_source = []
                    lines = source_text.splitlines(keepends=True)
                    
                    for line in lines:
                        if "]].set_index('DISTRICT')" in line:
                            # Replace with drop_duplicates then set_index
                            new_source.append("    ]].drop_duplicates(subset='DISTRICT').set_index('DISTRICT')\n")
                        else:
                            new_source.append(line)
                    
                    cell['source'] = new_source
                    cell_found = True
                    break
        
        if not cell_found:
            print("Error: Could not find the Visualization Cell to fix.")
            return

        with open(notebook_path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1)
        
        print(f"Successfully fixed notebook at {notebook_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    fix_notebook()

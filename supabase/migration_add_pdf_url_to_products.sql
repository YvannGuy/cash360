-- Ajouter la colonne pdf_url à la table products pour stocker l'URL du PDF des ebooks
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Ajouter un index pour améliorer les performances des requêtes filtrées par pdf_url
CREATE INDEX IF NOT EXISTS idx_products_pdf_url ON products(pdf_url) WHERE pdf_url IS NOT NULL;

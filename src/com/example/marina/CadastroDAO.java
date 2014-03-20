package com.example.marina;
import java.util.ArrayList;
import java.util.List;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

public class CadastroDAO extends SQLiteOpenHelper {

	//SQLiteDatabase db;
	private static final String LOGCAT = null;
	private static int VERSION = 1;
	private static String TABELA = "cadastro";
	private static String[] COLS = {"id", "nome", "bcartao", "ncartao" , "senha"};
	
	public CadastroDAO(Context context){
		super(context, TABELA, null, VERSION);
		
	}
	@Override
	public void onCreate(SQLiteDatabase db){
		String sql = "CREATE TABLE " + TABELA +
				" (id INTEGER PRIMARY KEY," +
				"nome TEXT," +
				"bcartao TEXT,"+
				"ncartao TEXT,"+
				"senha TEXT" +
				");";
				db.execSQL(sql);
				Log.d(LOGCAT,"tabela "+ TABELA + "criada");
	}
	@Override
	public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion){
		db.execSQL("DROP TABLE IF EXISTS " + CadastroDAO.TABELA);
		this.onCreate(db);
	}
	public void adicionar (Cadastro cadastro){
		ContentValues values = new ContentValues();
		values.put("nome", cadastro.getNome());
		values.put("bcartao", cadastro.getBcartao());
		values.put("ncartao", cadastro.getNcartao());
		values.put("senha", cadastro.getSenha());
		getWritableDatabase().insert(TABELA, null, values);
			
	}
	
	public List<Cadastro> getLista(){
		List<Cadastro> lista = new ArrayList<Cadastro>();
		Cursor c = getWritableDatabase().query(TABELA, COLS , null, null, null, null, null);
		while(c.moveToNext()){
			Cadastro cad = new Cadastro();
			cad.setId(c.getInt(0));
			cad.setNome(c.getString(1));
			cad.setBcartao(c.getString(2));
			cad.setNcartao(c.getString(3));
			
			lista.add(cad);
			
		}
		c.close();
		return lista;
	} 
	
	public List<String> getCartoes(){
		List<String> lista = new ArrayList<String>();
		Cursor c = getWritableDatabase().query(TABELA, COLS , null, null, null, null, null);
		String cartao;
		while(c.moveToNext()){
			cartao = c.getString(3);
			lista.add(cartao);
			
		}
		c.close();
		return lista;
	}
}
